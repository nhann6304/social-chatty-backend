import { v2 as cloudinary } from "cloudinary";
import { AppConf } from "src/constants";
const config = AppConf();

export class CloudinaryConfig {
    static configure(): void {
        cloudinary.config({
            cloud_name: config.CLOUDINARY_NAME,
            api_key: config.CLOUDINARY_API_KEY,
            api_secret: config.CLOUDINARY_API_SECRET,
        });
    }
}
