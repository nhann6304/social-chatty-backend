import {
    connect,
    JSONCodec,
    NatsConnection,
    Subscription,
    Codec,
} from "nats";
import { appConf, valuesCont } from "src/constants";

const config = appConf();
const val = valuesCont();

/**
 * Cấu hình & quản lý kết nối NATS (event bus).
 *
 * Vai trò trong dự án:
 * - Phát event khi dữ liệu thay đổi (vd "user.changed") để INVALIDATE cache.
 * - Sau này dùng chung cho việc sync dữ liệu sang Elasticsearch, gửi notification...
 *
 * Dùng JSONCodec: publish/subscribe làm việc trực tiếp với object JS,
 * không phải tự encode/decode Buffer.
 */
class NatsConfig {
    private connection: NatsConnection | null = null;
    /** Bộ mã hoá JSON dùng chung cho mọi message. */
    public readonly codec: Codec<unknown> = JSONCodec();

    async connect(): Promise<void> {
        try {
            this.connection = await connect({
                servers: config.NATS_URL,
                // Tự kết nối lại khi NATS server khởi động lại / mạng chập chờn.
                reconnect: true,
                maxReconnectAttempts: -1, // thử lại vô hạn
                reconnectTimeWait: 2000, // 2s/lần
            });
            console.log(
                `${val.SUCCESS} Kết nối NATS thành công ${this.connection.getServer()}`,
            );
            this.monitorStatus();
        } catch (error) {
            console.log(`${val.FAIL} Kết nối NATS thất bại:`, error);
        }
    }

    /** Lấy connection thô (ném lỗi nếu chưa connect). */
    get nc(): NatsConnection {
        if (!this.connection) {
            throw new Error("NATS chưa được kết nối. Gọi natsConfig.connect() trước.");
        }
        return this.connection;
    }

    /** NATS đã sẵn sàng chưa. */
    get isReady(): boolean {
        return !!this.connection && !this.connection.isClosed();
    }

    /**
     * PHÁT event lên 1 subject. Fire-and-forget (không chờ ai nhận).
     * @example natsConfig.publish("user.changed", { id, action: "update" })
     */
    publish<T>(subject: string, data: T): void {
        if (!this.isReady) return;
        this.nc.publish(subject, this.codec.encode(data));
    }

    /**
     * LẮNG NGHE 1 subject. Mỗi message nhận được sẽ chạy handler(data).
     * Trả về Subscription để có thể unsubscribe khi cần.
     *
     * @example
     * natsConfig.subscribe<{ id: string }>("user.changed", async ({ id }) => {
     *   await redisConfig.del(`users:id:${id}`);
     * });
     */
    subscribe<T>(
        subject: string,
        handler: (data: T) => Promise<void> | void,
    ): Subscription {
        const sub = this.nc.subscribe(subject);
        (async () => {
            for await (const msg of sub) {
                try {
                    const data = this.codec.decode(msg.data) as T;
                    await handler(data);
                } catch (error) {
                    console.log(`${val.FAIL} [NATS] Lỗi xử lý "${subject}":`, error);
                }
            }
        })();
        return sub;
    }

    /** Đóng kết nối gọn gàng (flush hết message đang chờ rồi mới đóng). */
    async close(): Promise<void> {
        if (this.connection) await this.connection.drain();
    }

    /** Log khi mất/khôi phục kết nối để dễ theo dõi vận hành. */
    private async monitorStatus(): Promise<void> {
        if (!this.connection) return;
        for await (const s of this.connection.status()) {
            if (s.type === "disconnect") {
                console.log(`${val.FAIL} [NATS] Mất kết nối`);
            }
            if (s.type === "reconnect") {
                console.log(`${val.SUCCESS} [NATS] Đã kết nối lại`);
            }
        }
    }
}

export const natsConfig: NatsConfig = new NatsConfig();
