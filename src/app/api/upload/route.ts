import { NextResponse } from 'next/server';
import { uploadFile, getPresignedUploadUrl, getUniqueKey } from '@/lib/storage';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const contentTypeHeader = request.headers.get('content-type') || '';

    // If client sends FormData directly (bypasses R2 bucket CORS completely)
    if (contentTypeHeader.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const pathname = (formData.get('pathname') as string) || '';

      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
      }

      // Preserve exact original filename provided by user
      const originalName = file.name || 'file';

      let desiredKey = '';
      if (pathname) {
        // If caller passed a structured path like submissions/<formId>/<filename>, use it directly
        desiredKey = pathname;
      } else {
        desiredKey = `uploads/${originalName}`;
      }

      // Check collision and assign unique key (original name first, or -2, -3 if collision)
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
    const body = await request.json();
    const { filename, contentType, pathname } = body;

    if (!filename && !pathname) {
      return NextResponse.json({ error: 'filename or pathname is required' }, { status: 400 });
    }

    // Preserve exact original filename provided by user
    const originalName = filename || pathname.split('/').pop() || 'file';

    let desiredKey = '';
    if (pathname) {
      // If caller passed a structured path like submissions/<formId>/<filename>, use it directly
      desiredKey = pathname;
    } else {
      desiredKey = `uploads/${originalName}`;
    }

    // Check collision and assign unique key (original name first, or -2, -3 if collision)
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
