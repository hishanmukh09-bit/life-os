import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { MediaDb, seedInitialDataIfEmpty } from '@/lib/db';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const contentType = req.headers.get('content-type') || '';

    let ownerId = 'user_shanmukh';
    let spaceId = 'space_lifeos_demo';
    let parentType = 'TASK_PROOF';
    let parentId: string | undefined = undefined;
    let visibility = 'PRIVATE';
    let caption: string | undefined = undefined;
    let buffer: Buffer;
    let ext = '.jpg';
    let mimeType = 'image/jpeg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'NO_FILE_PROVIDED' }, { status: 400 });
      }

      ownerId = (formData.get('ownerId') as string) || ownerId;
      spaceId = (formData.get('spaceId') as string) || spaceId;
      parentType = (formData.get('parentType') as string) || parentType;
      parentId = (formData.get('parentId') as string) || undefined;
      visibility = (formData.get('visibility') as string) || visibility;
      caption = (formData.get('caption') as string) || undefined;

      mimeType = file.type || 'image/jpeg';
      if (!mimeType.startsWith('image/')) {
        return NextResponse.json({ success: false, error: 'INVALID_FILE_TYPE: Must be an image.' }, { status: 400 });
      }

      if (mimeType.includes('png')) ext = '.png';
      else if (mimeType.includes('webp')) ext = '.webp';
      else if (mimeType.includes('gif')) ext = '.gif';
      else ext = '.jpg';

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // Base64 JSON payload from mobile camera capture
      const body = await req.json();
      const { dataUrl, fileBase64, ...meta } = body;
      const raw = dataUrl || fileBase64;
      if (!raw) {
        return NextResponse.json({ success: false, error: 'NO_IMAGE_DATA' }, { status: 400 });
      }

      ownerId = meta.ownerId || ownerId;
      spaceId = meta.spaceId || spaceId;
      parentType = meta.parentType || parentType;
      parentId = meta.parentId || undefined;
      visibility = meta.visibility || visibility;
      caption = meta.caption || undefined;

      const matches = raw.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
        if (mimeType.includes('png')) ext = '.png';
        else if (mimeType.includes('webp')) ext = '.webp';
        else ext = '.jpg';
      } else {
        buffer = Buffer.from(raw, 'base64');
      }
    }

    // Size validation: max 15MB
    if (buffer.length > 15 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'FILE_TOO_LARGE: Max 15MB allowed.' }, { status: 400 });
    }

    const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;

    const mediaId = MediaDb.create({
      ownerId,
      spaceId,
      parentType,
      parentId,
      url: publicUrl,
      storagePath: filePath,
      mimeType,
      sizeBytes: buffer.length,
      caption,
      visibility
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      mediaId,
      filename,
      sizeBytes: buffer.length,
      mimeType
    });
  } catch (error: any) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
