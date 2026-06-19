import { SearchEngine } from "src/helper/base.search.helper";
import { IBaseSearchQuery } from "src/interfaces/search";
import { getRepository } from "src/database/transaction";
import { UserEntity } from "./user.entity";

/* ─────────────── Khai báo index "users" (phần riêng của entity) ───────────────
 * Analyzer "vi_folded" = lowercase + asciifolding -> gõ "nhan" vẫn khớp "Nhân".
 * Logic search/index/paginate nằm trong SearchEngine (base.search.helper.ts).
 * --------------------------------------------------------------------------- */
export const userSearch = new SearchEngine<UserEntity>({
    index: "users",

    indexBody: {
        settings: {
            analysis: {
                analyzer: {
                    vi_folded: {
                        type: "custom",
                        tokenizer: "standard",
                        filter: ["lowercase", "asciifolding"],
                    },
                },
            },
        },
        mappings: {
            properties: {
                id: { type: "keyword" },
                us_name: { type: "text", analyzer: "vi_folded" },
                us_email: { type: "text", analyzer: "vi_folded" },
                us_uid: { type: "keyword" },
                us_work: { type: "text", analyzer: "vi_folded" },
                us_school: { type: "text", analyzer: "vi_folded" },
                us_location: {
                    type: "text",
                    analyzer: "vi_folded",
                    fields: { keyword: { type: "keyword" } }, // để lọc/sort chính xác
                },
                us_avatarImage: { type: "keyword", index: false },
                us_followers_count: { type: "integer" },
                us_following_count: { type: "integer" },
                us_posts_count: { type: "integer" },
                createdAt: { type: "date" },
            },
        },
    },

    searchableFields: [
        { name: "us_name", boost: 3 }, // tên quan trọng nhất
        { name: "us_uid", boost: 2 },
        { name: "us_email" },
        { name: "us_work" },
        { name: "us_school" },
        { name: "us_location" },
    ],

    getId: (u) => u.id,

    // Chỉ index field cần cho search — KHÔNG đưa us_password vào.
    toDoc: (u) => ({
        id: u.id,
        us_name: u.us_name,
        us_email: u.us_email,
        us_uid: u.us_uid,
        us_work: u.us_work,
        us_school: u.us_school,
        us_location: u.us_location,
        us_avatarImage: u.us_avatarImage,
        us_followers_count: u.us_followers_count,
        us_following_count: u.us_following_count,
        us_posts_count: u.us_posts_count,
        createdAt: u.createdAt,
    }),
});

/* ─────────────── Phần RIÊNG của User ───────────────
 * q / page / limit / sort / order kế thừa từ IBaseSearchQuery (khai báo 1 lần).
 * Ở đây chỉ thêm field LỌC riêng của User là `location`.
 * --------------------------------------------------- */
export interface SearchUserInput extends IBaseSearchQuery {
    location?: string;
}

export const searchUsers = (input: SearchUserInput) =>
    userSearch.search({
        ...input, // q, page, limit, sort, order đi thẳng qua
        filters: { "us_location.keyword": input.location }, // map field lọc riêng
    });

/** Backfill toàn bộ user vào ES — chỉ khi index đang trống. */
export const reindexUsersIfEmpty = async (): Promise<void> => {
    try {
        if ((await userSearch.count()) > 0) return;
        const users = await getRepository(UserEntity).find();
        const n = await userSearch.reindex(users);
        if (n) console.log(`🔎 [ES] Đã backfill ${n} user vào index`);
    } catch (error) {
        console.log("❌ [ES] Backfill thất bại:", error);
    }
};
