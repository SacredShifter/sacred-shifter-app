import backend from '~backend/client';

export const uploadFile = async (file: File): Promise<string> => {
  // 1. Get a signed URL from the backend
  const { uploadUrl, publicUrl } = await backend.messenger.getUploadUrl({
    filename: file.name,
    contentType: file.type,
  });

  // 2. Upload the file to the signed URL
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Upload failed:", errorText);
    throw new Error('File upload failed');
  }

  // 3. Return the public URL of the uploaded file
  return publicUrl;
};
