import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { storage } from "./lib/storage";
import { getDb } from "./queries/connection";
import { files } from "@db/schema";
import { requireSpace } from "./lib/helpers";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB (client compresses before upload)

export const storageRouter = createRouter({
  /** Authenticated image upload; keys are persisted, URLs are minted at render time. */
  upload: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(200),
        contentBase64: z.string(),
        contentType: z.string(),
        purpose: z
          .enum(["avatar", "task_proof", "meal", "workout", "journal", "memory", "general"])
          .default("general"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ALLOWED_TYPES.has(input.contentType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only JPEG, PNG or WebP images are allowed.",
        });
      }
      const bytes = Uint8Array.from(Buffer.from(input.contentBase64, "base64"));
      if (bytes.byteLength > MAX_BYTES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Image is too large (max 8 MB).",
        });
      }
      const sc = await requireSpace(ctx.user.id);
      const ext = input.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const saved = await storage.uploadFile({
        fileContent: bytes,
        fileName: `spaces/${sc.space.id}/${ctx.user.id}/${input.purpose}-${Date.now()}.${ext}`,
        contentType: input.contentType,
      });
      await getDb().insert(files).values({
        key: saved.key,
        ownerId: ctx.user.id,
        spaceId: sc.space.id,
        name: saved.fileName,
        size: saved.size,
        purpose: input.purpose,
      });
      return { key: saved.key, size: saved.size };
    }),

  /**
   * Mint a short-lived URL for a stored image.
   * Only the owner or their space partner may view a file.
   */
  url: authedQuery
    .input(z.object({ key: z.string().min(1).max(255) }))
    .query(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const db = getDb();
      const row = await db.query.files.findFirst({ where: eq(files.key, input.key) });
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      if (row.spaceId !== sc.space.id) {
        // Guessed URLs don't work: the file must belong to the caller's space.
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { url } = await storage.getPresignedUrl({ key: input.key });
      return { url };
    }),

  remove: authedQuery
    .input(z.object({ key: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.files.findFirst({ where: eq(files.key, input.key) });
      if (!row || row.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(files).where(eq(files.key, input.key));
      return { ok: await storage.deleteFile({ fileKey: input.key }) };
    }),
});
