export interface UploadOptions {
  access?: string;
  handleUploadUrl?: string;
  onUploadProgress?: (progress: { loaded: number; total: number; percentage: number }) => void;
  [key: string]: unknown;
}

export async function uploadToR2(
  fileOrPathname: string | File,
  fileOrOptions?: File | UploadOptions | ((pct: number) => void),
  maybeOptions?: UploadOptions | ((pct: number) => void)
): Promise<{ url: string }> {
  let file: File;
  let pathname: string | undefined;
  let onProgress: ((pct: number) => void) | undefined;

  if (typeof fileOrPathname === 'string') {
    pathname = fileOrPathname;
    file = fileOrOptions as File;
    if (typeof maybeOptions === 'function') {
      onProgress = maybeOptions;
    } else if (maybeOptions?.onUploadProgress) {
      const cb = maybeOptions.onUploadProgress;
      onProgress = (pct) => cb({ loaded: pct, total: 100, percentage: pct });
    }
  } else {
    file = fileOrPathname;
    if (typeof fileOrOptions === 'function') {
      onProgress = fileOrOptions;
    } else if (fileOrOptions && typeof fileOrOptions === 'object' && 'onUploadProgress' in fileOrOptions) {
      const cb = (fileOrOptions as UploadOptions).onUploadProgress;
      if (cb) {
        onProgress = (pct) => cb({ loaded: pct, total: 100, percentage: pct });
      }
    }
  }

  // 1. Request presigned upload URL from our API route
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      pathname,
      contentType: file.type || 'application/octet-stream',
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to get upload URL');
  }

  const { url, publicUrl } = await res.json();

  // 2. Upload file directly to R2
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ url: publicUrl });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload'));
    };

    xhr.send(file);
  });
}

// For drop-in compatibility with @vercel/blob/client upload()
export const upload = uploadToR2;
