import { NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '@/lib/storage';

export async function POST(request: Request): Promise<NextResponse> {
  try {
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
    console.error("Presigned URL Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
