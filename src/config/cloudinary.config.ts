import { v2 as cloudinary } from "cloudinary";
import { appConf } from "src/constants";
const config = appConf();

export class CloudinaryConfig {
    static configure(): void {
        cloudinary.config({
            cloud_name: config.CLOUDINARY_NAME,
            api_key: config.CLOUDINARY_API_KEY,
            api_secret: config.CLOUDINARY_API_SECRET,
        });
    }
}
