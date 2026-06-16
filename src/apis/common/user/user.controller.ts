import { Request, Response } from "express";
import { OK } from "src/core/response.core";
import { userService } from "./user.service";
import { CreateUserDto } from "./user.dto";
import { searchUsers, SearchUserInput } from "./user.search";

class UserController {
    // GET /users/search?q=&location=&page=&limit=&sort=&order=
    // Tìm kiếm + lọc + phân trang qua Elasticsearch.
    public async search(req: Request, res: Response) {
        const result = await searchUsers(req.query as SearchUserInput);

        new OK({
            message: "Kết quả tìm kiếm user",
            metadata: result,
        }).send(res);
    }

    public async create(req: Request, res: Response) {
        const payload = req.body as CreateUserDto;

        const item = await userService.create(payload);

        new OK({
            message: "Tạo user thành công",
            metadata: item,
        }).send(res);
    }

    public async findAll(req: Request, res: Response) {
        const items = await userService.findAll();

        new OK({
            message: "Danh sách user",
            metadata: items,
        }).send(res);
    }

    public async findOne(req: Request, res: Response) {
        const item = await userService.findById(String(req.params.id));

        new OK({
            message: "Chi tiết user",
            metadata: item,
        }).send(res);
    }
}

export const userController = new UserController();
