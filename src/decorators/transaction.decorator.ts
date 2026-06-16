import { runTransaction, IsolationLevel } from "src/database/transaction";

/**
 * @StartTransaction() — đánh lên một method của service để CẢ method chạy trong
 * MỘT transaction. Lỗi bất kỳ -> rollback toàn bộ; chạy xong êm -> commit.
 *
 * Bên trong method cứ dùng repository như bình thường, miễn là repository được
 * khai báo qua `getRepository()` (bám async-context) — không cần truyền `manager`.
 *
 * @example
 * class UserService {
 *     private get userRepository() { return getRepository(UserEntity); }
 *
 *     @StartTransaction()
 *     async create(dto: CreateUserDto) {
 *         await this.userRepository.save(...);
 *         // lỗi ở bất kỳ đâu -> rollback hết
 *     }
 * }
 */
export function StartTransaction(isolationLevel?: IsolationLevel) {
    return function (
        _target: object,
        _propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ): PropertyDescriptor {
        const originalMethod = descriptor.value;

        descriptor.value = async function (this: unknown, ...args: unknown[]) {
            return runTransaction(
                () => originalMethod.apply(this, args),
                isolationLevel
            );
        };

        return descriptor;
    };
}
