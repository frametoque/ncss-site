import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!; // e.g. https://pub-xyz.r2.dev (no trailing slash)

export const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Checks whether an object key already exists in the bucket.
 */
export async function checkObjectExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }));
    return true;
  } catch (err: any) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
}

/**
 * Generates a unique key:
 * - If the key does not exist yet: uses exact original key (report.pdf).
 * - If a collision occurs: appends numerical suffix (report-2.pdf, report-3.pdf, etc.).
 */
export async function getUniqueKey(key: string): Promise<string> {
  const cleanKey = key.replace(/^\/+/, '');
  const exists = await checkObjectExists(cleanKey);
  if (!exists) {
    return cleanKey;
  }

  // Key already exists! Separate folder, base name, and extension
  const lastSlashIndex = cleanKey.lastIndexOf('/');
  const folder = lastSlashIndex !== -1 ? cleanKey.substring(0, lastSlashIndex) : '';
  const filename = lastSlashIndex !== -1 ? cleanKey.substring(lastSlashIndex + 1) : cleanKey;

  const dotIndex = filename.lastIndexOf('.');
  const baseName = dotIndex !== -1 ? filename.substring(0, dotIndex) : filename;
  const ext = dotIndex !== -1 ? filename.substring(dotIndex) : '';

  // Try numerical suffix: filename-2.ext, filename-3.ext ...
  let counter = 2;
  while (counter <= 50) {
    const candidateKey = folder
      ? `${folder}/${baseName}-${counter}${ext}`
      : `${baseName}-${counter}${ext}`;

    const candidateExists = await checkObjectExists(candidateKey);
    if (!candidateExists) {
      return candidateKey;
    }
    counter++;
  }

  // Fallback if many collisions: append random 4-char suffix
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return folder
    ? `${folder}/${baseName}-${randomSuffix}${ext}`
    : `${baseName}-${randomSuffix}${ext}`;
}

/**
 * Returns the public URL for a given key.
 */
export function getPublicUrl(key: string): string {
  // Ensure the key doesn't have a leading slash when appending
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  return `${R2_PUBLIC_URL}/${cleanKey}`;
}

/**
 * Uploads a file directly from server to R2.
 */
export async function uploadFile(key: string, file: Buffer | Uint8Array | Blob | string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return getPublicUrl(key);
}

/**
 * Deletes a file from R2.
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generates a presigned URL for direct client-to-R2 upload.
 */
export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  // URL expires in 1 hour
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Rewrites any leftover Vercel Blob URL to its equivalent R2 public URL at render time.
 */
export function rewriteVercelBlobUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url;
  const vercelDomainMatch = url.match(/https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\/(.+)$/);
  if (vercelDomainMatch && process.env.R2_PUBLIC_URL) {
    const key = vercelDomainMatch[1];
    return getPublicUrl(key);
  }
  return url;
}

/**
 * Recursively rewrites any leftover Vercel Blob URLs inside objects/arrays/JSON.
 */
export function rewriteDataUrls(data: any): any {
  if (!data) return data;
  if (typeof data === 'string') {
    // If it's a JSON string, try parsing it
    if ((data.startsWith('{') && data.endsWith('}')) || (data.startsWith('[') && data.endsWith(']'))) {
      try {
        const parsed = JSON.parse(data);
        return JSON.stringify(rewriteDataUrls(parsed));
      } catch {
        // Fallback to plain string rewrite
      }
    }
    return rewriteVercelBlobUrl(data);
  }
  if (Array.isArray(data)) {
    return data.map(rewriteDataUrls);
  }
  if (typeof data === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      out[k] = rewriteDataUrls(v);
    }
    return out;
  }
  return data;
}
