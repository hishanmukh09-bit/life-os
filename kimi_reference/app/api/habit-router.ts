import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { habitLogs, habits } from "@db/schema";
import { addDays, requireSpace, todayStr } from "./lib/helpers";

function computeStreak(dates: Set<string>, today: string) {
  let streak = 0;
  let cursor = dates.has(today) ? today : addDays(today, -1);
  while (dates.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function longestStreak(sorted: string[]): number {
  let best = 0;
  let cur = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    if (prev && addDays(prev, 1) === d) cur++;
    else cur = 1;
    best = Math.max(best, cur);
    prev = d;
  }
  return best;
}

export const habitRouter = createRouter({
  /** My habits + partner's shared habits, each with stats. */
  list: authedQuery.query(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    const db = getDb();
    const allHabits = await db
      .select()
      .from(habits)
      .where(and(eq(habits.spaceId, sc.space.id), eq(habits.archived, false)));
    const visible = allHabits.filter(
      (h) => h.userId === ctx.user.id || h.visibility === "shared",
    );
    const habitIds = visible.map((h) => h.id);
    const relevantLogs = habitIds.length
      ? await db
          .select()
          .from(habitLogs)
          .where(inArray(habitLogs.habitId, habitIds))
      : [];
    const today = todayStr();
    return visible.map((h) => {
      const mine = h.userId === ctx.user.id;
      const dates = new Set(
        relevantLogs.filter((l) => l.habitId === h.id).map((l) => l.date),
      );
      const sorted = [...dates].sort();
      const last30 = sorted.filter((d) => d >= addDays(today, -29)).length;
      return {
        ...h,
        mine,
        doneToday: dates.has(today),
        currentStreak: computeStreak(dates, today),
        bestStreak: longestStreak(sorted),
        consistency30: Math.round((last30 / 30) * 100),
        week: Array.from({ length: 7 }, (_, i) => {
          const d = addDays(today, i - 6);
          return { date: d, done: dates.has(d) };
        }),
      };
    });
  }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(120),
        icon: z.string().max(32).nullish(),
        color: z.string().max(16).nullish(),
        visibility: z.enum(["private", "shared"]).default("shared"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const [{ id }] = await getDb()
        .insert(habits)
        .values({ spaceId: sc.space.id, userId: ctx.user.id, ...input })
        .$returningId();
      return { id };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(120).optional(),
        archived: z.boolean().optional(),
        visibility: z.enum(["private", "shared"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.habits.findFirst({
        where: eq(habits.id, input.id),
      });
      if (!row || row.userId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...patch } = input;
      await db.update(habits).set(patch).where(eq(habits.id, id));
      return { ok: true };
    }),

  toggle: authedQuery
    .input(z.object({ habitId: z.number(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.habits.findFirst({
        where: eq(habits.id, input.habitId),
      });
      if (!row || row.userId !== ctx.user.id)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can log this habit.",
        });
      const date = input.date ?? todayStr();
      const existing = await db.query.habitLogs.findFirst({
        where: and(eq(habitLogs.habitId, row.id), eq(habitLogs.date, date)),
      });
      if (existing) {
        await db.delete(habitLogs).where(eq(habitLogs.id, existing.id));
        return { done: false };
      }
      await db
        .insert(habitLogs)
        .values({ habitId: row.id, userId: ctx.user.id, date });
      return { done: true };
    }),
});
