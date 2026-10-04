import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/server-auth';

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
    const user = await getAuthUser(req);
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const media = getDb().prepare(`
      SELECT m.* FROM media m
      JOIN space_members sm ON sm.space_id = m.space_id AND sm.user_id = ?
      WHERE m.url = ? OR m.storage_path LIKE ?
      LIMIT 1
    `).get(user.id, `/uploads/${safeFilename}`, `%${safeFilename}`) as any;

    if (!media) return new NextResponse('File not found', { status: 404 });
    if (media.owner_id !== user.id && media.visibility !== 'SHARED') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const filePath = media.storage_path || path.join(process.cwd(), 'data', 'uploads', safeFilename);
    const resolvedRoot = path.resolve(process.cwd(), 'data', 'uploads');
    const resolvedFile = path.resolve(filePath);
    if (!resolvedFile.startsWith(resolvedRoot)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

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
        'Cache-Control': 'private, max-age=300',
        'Content-Length': fileBuffer.length.toString(),
      }
    });
  } catch (error: any) {
    console.error('Error serving upload:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
