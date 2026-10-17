import { NextResponse } from 'next/server';
import { uploadFile, getPresignedUploadUrl, getUniqueKey } from '@/lib/storage';
import { getSession } from '@/lib/auth';
import { uploadRateLimiter, getClientIp } from '@/lib/rate-limit';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

// Extensions forbidden for non-admin uploads to prevent HTML/SVG XSS and executable uploads
const DISALLOWED_EXTENSIONS = new Set([
  '.html', '.htm', '.xhtml', '.svg', '.xml',
  '.php', '.phtml', '.php3', '.php4', '.php5',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.sh', '.bash', '.bat', '.cmd', '.ps1', '.vbs',
  '.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx',
  '.py', '.rb', '.pl', '.cgi', '.jar', '.war'
]);

function isExtensionAllowed(filename: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return false;
  const ext = filename.slice(dotIndex).toLowerCase();
  return !DISALLOWED_EXTENSIONS.has(ext);
}

function sanitizePath(pathname: string): string {
  // Prevent directory traversal attacks
  return pathname
    .replace(/\\/g, '/')
    .replace(/\0/g, '')
    .split('/')
    .filter(segment => segment && segment !== '.' && segment !== '..')
    .join('/');
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/[^\w.-]/g, '_').replace(/^\.+/, '');
  return base || 'file';
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Rate limiting
    const ip = await getClientIp(request);
    const rateCheck = uploadRateLimiter.check(ip);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please slow down.' },
        { status: 429 }
      );
    }

    const session = await getSession();
    const isAdmin = !!session;

    const contentTypeHeader = request.headers.get('content-type') || '';

    // If client sends FormData directly
    if (contentTypeHeader.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const rawPathname = (formData.get('pathname') as string) || '';

      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: 'File size exceeds maximum 25MB limit' }, { status: 400 });
      }

      const originalName = sanitizeFilename(file.name || 'file');

      if (!isExtensionAllowed(originalName, isAdmin)) {
        return NextResponse.json(
          { error: 'This file type is not permitted for upload' },
          { status: 400 }
        );
      }

      let desiredKey = '';
      if (rawPathname) {
        const cleanPath = sanitizePath(rawPathname);
        // Non-admin can only write to form-submission or submissions directory
        if (!isAdmin && !cleanPath.startsWith('form-submission/') && !cleanPath.startsWith('submissions/')) {
          desiredKey = `submissions/${cleanPath}`;
        } else {
          desiredKey = cleanPath;
        }
      } else {
        desiredKey = `uploads/${originalName}`;
      }

      const key = await getUniqueKey(desiredKey);
      const buffer = Buffer.from(await file.arrayBuffer());
      const publicUrl = await uploadFile(key, buffer, file.type || 'application/octet-stream');

      return NextResponse.json({
        url: publicUrl,
        publicUrl,
        key,
        blob: { url: publicUrl, pathname: key }
      });
    }

    // Otherwise JSON request for presigned URL
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { filename, contentType, pathname: rawPathname } = body;

    if (!filename && !rawPathname) {
      return NextResponse.json({ error: 'filename or pathname is required' }, { status: 400 });
    }

    const originalName = sanitizeFilename(filename || String(rawPathname).split('/').pop() || 'file');

    if (!isExtensionAllowed(originalName, isAdmin)) {
      return NextResponse.json(
        { error: 'This file type is not permitted for upload' },
        { status: 400 }
      );
    }

    let desiredKey = '';
    if (rawPathname) {
      const cleanPath = sanitizePath(String(rawPathname));
      if (!isAdmin && !cleanPath.startsWith('form-submission/') && !cleanPath.startsWith('submissions/')) {
        desiredKey = `submissions/${cleanPath}`;
      } else {
        desiredKey = cleanPath;
      }
    } else {
      desiredKey = `uploads/${originalName}`;
    }

    const key = await getUniqueKey(desiredKey);
    const type = contentType || 'application/octet-stream';
    const url = await getPresignedUploadUrl(key, type);
    const publicUrl = `${(process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')}/${key}`;

    return NextResponse.json({ 
      url, 
      key, 
      publicUrl,
      blob: { url: publicUrl, pathname: key }
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
