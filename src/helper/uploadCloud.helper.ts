import {
    UploadApiErrorResponse,
    UploadApiResponse,
    v2 as cloudinary,
} from "cloudinary";

export function uploads({
    file,
    invalidate,
    overwrite,
    public_id,
}: {
    file: string;
    public_id?: string;
    overwrite?: boolean;
    invalidate?: boolean;
}): Promise<UploadApiResponse | UploadApiErrorResponse | undefined> {
    return new Promise((resolve) => {
        cloudinary.uploader.upload(file, { public_id, overwrite, invalidate }),
            (
                error: UploadApiErrorResponse | undefined,
                result: UploadApiResponse | undefined
            ) => {
                if (error) resolve(error);
                resolve(result);
            };
    });
}
