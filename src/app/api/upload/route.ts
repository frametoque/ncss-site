import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Here you could verify the user is logged in if you had auth
        // Since auth is skipped for now, we just allow the upload
        return {
          maximumSizeInBytes: 1024 * 1024 * 1024, // 1GB limit
          addRandomSuffix: true,
          // Keep tokens alive long enough for large uploads
          tokenPayload: JSON.stringify({
            // Any custom metadata you want to attach
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Fired after the upload is complete
        // Log removed for production
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Vercel Blob Client Upload Error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
