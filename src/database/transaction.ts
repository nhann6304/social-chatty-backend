import { AsyncLocalStorage } from "async_hooks";
import {
    EntityManager,
    EntityTarget,
    ObjectLiteral,
    Repository,
} from "typeorm";
import { AppDataSource } from "src/config";
import { TIsolationLevel } from "src/type/common/IsolationLevel.type";

/* ──────────────────────────── Context (CLS) ────────────────────────────
 * Lưu EntityManager của transaction đang chạy theo async-context, nhờ vậy
 * repository tự "bám" đúng transaction mà không phải truyền `manager` thủ công.
 * ----------------------------------------------------------------------- */

export const transactionContext = new AsyncLocalStorage<EntityManager>();

/**
 * EntityManager hiện hành:
 * - Trong @StartTransaction / runTransaction -> manager của transaction.
 * - Ngoài transaction -> manager mặc định (mỗi câu lệnh tự auto-commit).
 */
export const getManager = (): EntityManager =>
    transactionContext.getStore() ?? AppDataSource.manager;

/**
 * Repository "bám" transaction: luôn lấy theo manager hiện hành.
 *   private get userRepository() { return getRepository(UserEntity); }
 */
export const getRepository = <Entity extends ObjectLiteral>(
    target: EntityTarget<Entity>,
): Repository<Entity> => getManager().getRepository(target);

/* ─────────────────────── Runner (begin/commit/rollback) ─────────────────
 * LÕI transaction. Thường ngày dùng @StartTransaction cho gọn; chỉ gọi trực
 * tiếp runTransaction khi cần kiểm soát thủ công (vd tách side-effect ra ngoài).
 * ----------------------------------------------------------------------- */

/**
 * Chạy một khối nghiệp vụ trong MỘT transaction để đảm bảo ACID.
 * - Chạy xong không lỗi -> COMMIT.
 * - Lỗi bất kỳ -> ROLLBACK toàn bộ.
 * - Luôn release connection về pool ở `finally`.
 */
export const runTransaction = async <T>(
    handler: (manager: EntityManager) => Promise<T>,
    isolationLevel?: TIsolationLevel,
): Promise<T> => {
    const queryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction(isolationLevel);

    try {
        // Chạy handler trong async-context để getRepository() bám đúng transaction.
        const result = await transactionContext.run(queryRunner.manager, () =>
            handler(queryRunner.manager),
        );
        await queryRunner.commitTransaction();
        return result;
    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
    }
};
