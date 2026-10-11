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

  // Upload via Next.js API route using FormData with progress tracking
  // This completely eliminates CORS issues because the upload goes to the same origin (/api/upload),
  // which forwards directly to R2 using server-side S3 client.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    const formData = new FormData();
    formData.append('file', file);
    if (pathname) {
      formData.append('pathname', pathname);
    }

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
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({ url: res.publicUrl || res.url });
        } catch {
          reject(new Error('Invalid response from upload server'));
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          reject(new Error(res.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload'));
    };

    xhr.send(formData);
  });
}

// For drop-in compatibility with @vercel/blob/client upload()
export const upload = uploadToR2;
