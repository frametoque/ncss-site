import { NextResponse } from 'next/server';
import { uploadFile, getPresignedUploadUrl } from '@/lib/storage';

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

      const name = file.name || 'file';
      const safeName = name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const randomSuffix = Math.random().toString(36).substring(2, 9);

      let key = '';
      if (pathname) {
        const parts = pathname.split('/');
        parts.pop();
        const folder = parts.join('/');
        key = folder ? `${folder}/${Date.now()}-${randomSuffix}_${safeName}` : `${Date.now()}-${randomSuffix}_${safeName}`;
      } else {
        key = `uploads/${Date.now()}-${randomSuffix}_${safeName}`;
      }
      key = key.replace(/^\/+/, '');

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

    const name = filename || pathname.split('/').pop() || 'file';
    const safeName = name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const randomSuffix = Math.random().toString(36).substring(2, 9);

    let key = '';
    if (pathname) {
      // Keep similar structure: folder/safeName-randomSuffix.ext
      const parts = pathname.split('/');
      parts.pop();
      const folder = parts.join('/');
      key = folder ? `${folder}/${Date.now()}-${randomSuffix}_${safeName}` : `${Date.now()}-${randomSuffix}_${safeName}`;
    } else {
      key = `uploads/${Date.now()}-${randomSuffix}_${safeName}`;
    }

    // Clean key (no leading slash)
    key = key.replace(/^\/+/, '');

    const type = contentType || 'application/octet-stream';
    const url = await getPresignedUploadUrl(key, type);

    const publicUrl = `${(process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')}/${key}`;

    return NextResponse.json({ 
      url, 
      key, 
      publicUrl,
      // Provide compatibility with vercel blob client response structure if needed
      blob: { url: publicUrl, pathname: key }
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
