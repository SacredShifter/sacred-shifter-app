import { api } from "encore.dev/api";
import { Bucket } from "encore.dev/storage/objects";
import { v4 as uuidv4 } from 'uuid';

const attachmentsBucket = new Bucket("messenger-attachments", {
  public: true,
});

interface GetUploadUrlRequest {
  filename: string;
  contentType: string;
}

interface GetUploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}

// Generates a signed URL for uploading a file.
export const getUploadUrl = api<GetUploadUrlRequest, GetUploadUrlResponse>(
  { expose: true, method: "POST", path: "/messenger/files/upload-url" },
  async ({ filename, contentType }) => {
    const fileExt = filename.split('.').pop() || '';
    const objectName = `${uuidv4()}.${fileExt}`;

    const { url } = await attachmentsBucket.signedUploadUrl(objectName, {
      ttl: 300, // 5 minutes
      contentType: contentType,
    });

    return {
      uploadUrl: url,
      publicUrl: attachmentsBucket.publicUrl(objectName),
    };
  }
);
