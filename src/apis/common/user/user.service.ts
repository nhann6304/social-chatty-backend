import { Repository } from "typeorm";
import { UserEntity } from "src/apis/common/user/user.entity";
import { UtilConvert } from "src/utils/convert.util";
import { CreateUserDto } from "./user.dto";
import { IUser } from "src/interfaces/models";
import { BadRequestException } from "src/abstracts/common/ACustomError.abstract";
import { UtilCalculate } from "src/utils";
import { uploads, destroyCloud } from "src/helper/uploadCloud.helper";
import { getRepository } from "src/database/transaction";
import { StartTransaction, Cacheable, CacheEvict, EmitEvent } from "src/decorators";
import { v4 as uuidv4 } from "uuid";
import { UserKey } from "./user.cache-key";
import { EVENT_SUBJECT } from "src/events/event.subject";

class UserService {
    // Getter: mỗi lần truy cập đều lấy repository theo manager hiện hành.
    // Trong @Transactional -> repo của transaction; ngoài -> repo mặc định.
    private get userRepository(): Repository<UserEntity> {
        return getRepository(UserEntity);
    }

    public async getUserByUsernameOrEmail({
        us_email,
        us_name,
    }: Pick<IUser, "us_name" | "us_email">) {
        const username = UtilConvert.convertFirstLetterUppercase(us_name);
        const email = UtilConvert.lowerCase(us_email);

        const findUser = await this.userRepository.findOne({
            where: [{ us_name: username }, { us_email: email }],
        });

        return findUser;
    }

    // ĐỌC: cache 5 phút. HIT trả luôn, MISS mới chạm DB rồi tự ghi cache.
    @Cacheable({ key: UserKey.listAll, ttl: 300 })
    public async findAll(): Promise<UserEntity[]> {
        return this.userRepository.find();
    }

    // ĐỌC: key động theo id, cache 10 phút.
    @Cacheable({ key: UserKey.byId, ttl: 600 })
    public async findById(id: string): Promise<UserEntity | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    // GHI: tạo user mới -> phát event (index ES) + xoá cache danh sách.
    // Thứ tự decorator (áp từ dưới lên): StartTransaction (commit) -> CacheEvict
    // (xoá cache) -> EmitEvent (phát "user.changed" cho ES) — tất cả sau khi commit.
    @EmitEvent(EVENT_SUBJECT.USER_CHANGED, (user: UserEntity) => ({
        id: user.id,
        action: "create",
    }))
    @CacheEvict({ pattern: UserKey.listPattern })
    @StartTransaction()
    public async create(payload: CreateUserDto): Promise<UserEntity> {
        const { us_name, us_email } = payload;

        const uId = `${UtilCalculate.generateRandomIntegers(10)}`;
        const userId = uuidv4();

        // 1. Kiểm tra tồn tại trước (read-only) để khỏi upload thừa khi đã có user.
        const checkIfUserExist = await this.getUserByUsernameOrEmail({
            us_email,
            us_name,
        });

        if (checkIfUserExist) {
            throw new BadRequestException("Người dùng đã tồn tại");
        }

        // 2. Upload ảnh — side-effect NGOÀI DB. Đang chạy trong transaction nên
        //    giữ connection; nếu rollback sẽ xoá bù ảnh ở catch bên dưới.
        const result = await uploads({
            file: payload.us_avatarImage,
            public_id: `social/${userId}`,
            invalidate: true,
            overwrite: true,
        });
        if (!result?.public_id) {
            throw new BadRequestException("Upload file thất bại");
        }

        // 3. Ghi DB: dùng repo như thường, @Transactional lo commit/rollback.
        try {
            const dataCreate = this.userRepository.create({
                ...payload,
                us_uid: uId,
                us_avatarImage: result.secure_url,
            });

            return await this.userRepository.save(dataCreate);
        } catch (error) {
            // @Transactional sẽ rollback DB, nhưng ảnh đã lên cloud -> xoá bù.
            await destroyCloud(result.public_id);
            throw error; // ném tiếp để @Transactional bắt và rollback
        }
    }
}

export const userService: UserService = new UserService();
