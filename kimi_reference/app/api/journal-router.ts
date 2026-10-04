import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { asc, desc, eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { journalEntries, memories } from "@db/schema";
import { requireSpace, todayStr } from "./lib/helpers";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const journalRouter = createRouter({
  /** My entries, plus partner entries they explicitly shared. */
  list: authedQuery.query(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    const rows = await getDb()
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.spaceId, sc.space.id))
      .orderBy(desc(journalEntries.date));
    return rows
      .filter((j) => j.userId === ctx.user.id || j.visibility === "shared")
      .map((j) => ({ ...j, mine: j.userId === ctx.user.id }));
  }),

  upsert: authedQuery
    .input(
      z.object({
        id: z.number().nullish(),
        date: dateStr.optional(),
        title: z.string().max(200).nullish(),
        content: z.string().min(1).max(20000),
        mood: z.enum(["great", "good", "okay", "low", "tired"]).nullish(),
        highlights: z.string().max(500).nullish(),
        lessons: z.string().max(500).nullish(),
        gratitude: z.string().max(500).nullish(),
        photoKey: z.string().max(255).nullish(),
        visibility: z.enum(["private", "shared"]).default("private"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const db = getDb();
      if (input.id) {
        const row = await db.query.journalEntries.findFirst({
          where: eq(journalEntries.id, input.id),
        });
        if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...patch } = input;
        await db
          .update(journalEntries)
          .set({
            title: patch.title ?? row.title,
            content: patch.content,
            mood: patch.mood ?? row.mood,
            highlights: patch.highlights ?? row.highlights,
            lessons: patch.lessons ?? row.lessons,
            gratitude: patch.gratitude ?? row.gratitude,
            photoKey: patch.photoKey ?? row.photoKey,
            visibility: patch.visibility,
          })
          .where(eq(journalEntries.id, id!));
        return { id: id! };
      }
      const [{ id }] = await db
        .insert(journalEntries)
        .values({
          spaceId: sc.space.id,
          userId: ctx.user.id,
          date: input.date ?? todayStr(),
          title: input.title ?? null,
          content: input.content,
          mood: input.mood ?? null,
          highlights: input.highlights ?? null,
          lessons: input.lessons ?? null,
          gratitude: input.gratitude ?? null,
          photoKey: input.photoKey ?? null,
          visibility: input.visibility,
        })
        .$returningId();
      return { id };
    }),

  remove: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.journalEntries.findFirst({
        where: eq(journalEntries.id, input.id),
      });
      if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(journalEntries).where(eq(journalEntries.id, input.id));
      return { ok: true };
    }),
});

export const memoryRouter = createRouter({
  /** Memories are deliberately saved shared moments — visible to both members. */
  list: authedQuery.query(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    const rows = await getDb()
      .select()
      .from(memories)
      .where(eq(memories.spaceId, sc.space.id))
      .orderBy(asc(memories.date));
    return rows.map((m) => ({ ...m, mine: m.userId === ctx.user.id }));
  }),

  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(4000).nullish(),
        date: dateStr,
        photoKey: z.string().max(255).nullish(),
        type: z.enum([
          "photo", "achievement", "goal", "trip", "special_day", "activity", "event",
        ]).default("special_day"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const [{ id }] = await getDb()
        .insert(memories)
        .values({
          spaceId: sc.space.id,
          userId: ctx.user.id,
          title: input.title,
          description: input.description ?? null,
          date: input.date,
          photoKey: input.photoKey ?? null,
          type: input.type,
        })
        .$returningId();
      return { id };
    }),

  remove: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.memories.findFirst({
        where: eq(memories.id, input.id),
      });
      if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(memories).where(eq(memories.id, input.id));
      return { ok: true };
    }),
});
