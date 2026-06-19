/** Field full-text để multi_match (kèm boost độ ưu tiên). */
export interface ISearchableField {
    name: string;
    boost?: number;
}
