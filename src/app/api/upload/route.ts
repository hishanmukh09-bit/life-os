import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { AccessDb, AuthDb, MediaDb, createId, seedInitialDataIfEmpty } from '@/lib/db';
import { getAuthUser } from '@/lib/server-auth';

function getUploadsDir(): string {
  if (process.env.UPLOADS_DIR) return process.env.UPLOADS_DIR;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'data', 'uploads');
  }
  return path.join(process.cwd(), 'data', 'uploads');
}

const UPLOADS_DIR = getUploadsDir();

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Uploads directory warning:', e);
}

async function resolveUser(req: NextRequest, fallbackUserId?: string) {
  const sessionUser = await getAuthUser(req);
  if (sessionUser) return sessionUser;
  
  const userId = fallbackUserId || 'user_shanmukh';
  const name = userId === 'user_satvika' ? 'Satvika' : 'Shanmukh';
  return { id: userId, name, email: `${userId}@lifeos.me` };
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

      ownerId = (formData.get('ownerId') as string) || (formData.get('userId') as string) || ownerId;
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

      ownerId = meta.ownerId || meta.userId || ownerId;
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

    const user = await resolveUser(req, ownerId);
    ownerId = user.id;

    // Size validation: max 15MB
    if (!spaceId) {
      return NextResponse.json({ success: false, error: 'NO_SPACE' }, { status: 400 });
    }
    AccessDb.assertSpaceMember(spaceId, user.id);

    const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']);
    if (!allowedMimes.has(mimeType)) {
      return NextResponse.json({ success: false, error: 'INVALID_FILE_TYPE' }, { status: 400 });
    }

    if (buffer.length > 15 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'FILE_TOO_LARGE: Max 15MB allowed.' }, { status: 400 });
    }

    const filename = `${createId('photo')}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, buffer);

    const mediaId = MediaDb.create({
      ownerId,
      spaceId,
      parentType,
      parentId,
      url: `/uploads/${mediaIdPlaceholder(filename)}`,
      storagePath: filePath,
      mimeType,
      sizeBytes: buffer.length,
      caption,
      visibility
    });

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
      mediaId,
      filename,
      sizeBytes: buffer.length,
      mimeType
    });
  } catch (error: any) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

function mediaIdPlaceholder(filename: string) {
  return filename;
}
