import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

// CVs are stored on Cloudinary as private ("authenticated") files: a CV holds personal details,
// so there's no public link. The backend hands out short-lived download links instead.

export const cloudinaryReady = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);

if (cloudinaryReady) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// One CV per user, so uploading again replaces the old one
const resumeId = (userId: string) => `duckfind/resumes/${userId}.pdf`;

export function uploadResume(userId: string, file: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        type: "authenticated",
        public_id: resumeId(userId),
        overwrite: true,
        invalidate: true,
      },
      (error, result) => (error || !result ? reject(error) : resolve(result.secure_url)),
    );
    upload.end(file);
  });
}

export async function deleteResume(userId: string) {
  await cloudinary.uploader.destroy(resumeId(userId), {
    resource_type: "raw",
    type: "authenticated",
    invalidate: true,
  });
}

// A download link that works for 10 minutes
export function resumeDownloadLink(userId: string) {
  return cloudinary.utils.private_download_url(resumeId(userId), "", {
    resource_type: "raw",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 10 * 60,
  });
}
