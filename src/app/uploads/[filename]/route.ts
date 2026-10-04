import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const resolvedParams = await params;
    const filename = resolvedParams.filename;
    if (!filename) {
      return new NextResponse('Filename required', { status: 400 });
    }

    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'public', 'uploads', safeFilename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Determine content type
    let contentType = 'image/jpeg';
    const lower = safeFilename.toLowerCase();
    if (lower.endsWith('.png')) contentType = 'image/png';
    else if (lower.endsWith('.webp')) contentType = 'image/webp';
    else if (lower.endsWith('.gif')) contentType = 'image/gif';
    else if (lower.endsWith('.svg')) contentType = 'image/svg+xml';
    else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) contentType = 'image/jpeg';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileBuffer.length.toString(),
      }
    });
  } catch (error: any) {
    console.error('Error serving upload:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
