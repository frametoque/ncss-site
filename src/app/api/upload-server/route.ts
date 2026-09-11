import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Server-side put automatically handles large files (>5MB) 
    // without requiring webhook callbacks to localhost!
    const blob = await put(file.name, file, { 
      access: 'public',
      addRandomSuffix: true
    });
    
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const err = error as Error & { status?: number; code?: string };
    console.error('Server upload error:', {
      message: err.message,
      name: err.name,
      status: err.status,
      code: err.code,
      stack: err.stack,
    });
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: 500 }
    );
  }
}
