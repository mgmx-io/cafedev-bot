import {
	R2_ACCESS_KEY_ID,
	R2_ACCOUNT_ID,
	R2_BUCKET,
	R2_SECRET_ACCESS_KEY,
} from "@server/lib/env";
import { S3Client } from "bun";

export const r2 = new S3Client({
	accessKeyId: R2_ACCESS_KEY_ID,
	secretAccessKey: R2_SECRET_ACCESS_KEY,
	bucket: R2_BUCKET,
	endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
});
