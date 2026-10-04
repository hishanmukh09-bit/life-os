import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, gte } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  cycleLogs,
  dailyCheckins,
  meals,
  sleepLogs,
  waterLogs,
  workouts,
} from "@db/schema";
import { addDays, requireSpace, todayStr } from "./lib/helpers";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const visEnum = z.enum(["private", "shared"]);

export const trackerRouter = createRouter({
  // ---------------- Water ----------------
  waterToday: authedQuery.query(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    const rows = await getDb()
      .select()
      .from(waterLogs)
      .where(and(eq(waterLogs.userId, ctx.user.id), eq(waterLogs.date, todayStr())));
    return { total: rows.reduce((s, r) => s + r.amountMl, 0), logs: rows, spaceId: sc.space.id };
  }),

  waterWeek: authedQuery.query(async ({ ctx }) => {
    await requireSpace(ctx.user.id);
    const today = todayStr();
    const rows = await getDb()
      .select()
      .from(waterLogs)
      .where(and(eq(waterLogs.userId, ctx.user.id), gte(waterLogs.date, addDays(today, -6))));
    const byDay = new Map<string, number>();
    for (const r of rows) byDay.set(r.date, (byDay.get(r.date) ?? 0) + r.amountMl);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, i - 6);
      return { date: d, amountMl: byDay.get(d) ?? 0 };
    });
  }),

  addWater: authedQuery
    .input(z.object({ amountMl: z.number().int().min(1).max(3000) }))
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      await getDb().insert(waterLogs).values({
        spaceId: sc.space.id,
        userId: ctx.user.id,
        date: todayStr(),
        amountMl: input.amountMl,
      });
      return { ok: true };
    }),

  // ---------------- Sleep ----------------
  sleepList: authedQuery
    .input(z.object({ days: z.number().int().min(7).max(180).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      await requireSpace(ctx.user.id);
      const days = input?.days ?? 30;
      return getDb()
        .select()
        .from(sleepLogs)
        .where(
          and(
            eq(sleepLogs.userId, ctx.user.id),
            gte(sleepLogs.date, addDays(todayStr(), -(days - 1))),
          ),
        )
        .orderBy(asc(sleepLogs.date));
    }),

  logSleep: authedQuery
    .input(
      z.object({
        date: dateStr.optional(),
        bedtime: z.string().regex(/^\d{2}:\d{2}$/).nullish(),
        wakeTime: z.string().regex(/^\d{2}:\d{2}$/).nullish(),
        durationMin: z.number().int().min(0).max(1440).nullish(),
        quality: z.number().int().min(1).max(5).nullish(),
        notes: z.string().max(255).nullish(),
        visibility: visEnum.default("shared"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const db = getDb();
      const date = input.date ?? todayStr();
      let duration = input.durationMin ?? null;
      if (duration == null && input.bedtime && input.wakeTime) {
        const [bh, bm] = input.bedtime.split(":").map(Number);
        const [wh, wm] = input.wakeTime.split(":").map(Number);
        duration = (wh * 60 + wm - (bh * 60 + bm) + 1440) % 1440;
      }
      const existing = await db.query.sleepLogs.findFirst({
        where: and(eq(sleepLogs.userId, ctx.user.id), eq(sleepLogs.date, date)),
      });
      if (existing) {
        await db
          .update(sleepLogs)
          .set({
            bedtime: input.bedtime ?? existing.bedtime,
            wakeTime: input.wakeTime ?? existing.wakeTime,
            durationMin: duration ?? existing.durationMin,
            quality: input.quality ?? existing.quality,
            notes: input.notes ?? existing.notes,
            visibility: input.visibility,
          })
          .where(eq(sleepLogs.id, existing.id));
        return { id: existing.id };
      }
      const [{ id }] = await db
        .insert(sleepLogs)
        .values({
          spaceId: sc.space.id,
          userId: ctx.user.id,
          date,
          bedtime: input.bedtime ?? null,
          wakeTime: input.wakeTime ?? null,
          durationMin: duration,
          quality: input.quality ?? null,
          notes: input.notes ?? null,
          visibility: input.visibility,
        })
        .$returningId();
      return { id };
    }),

  // ---------------- Meals ----------------
  mealList: authedQuery
    .input(z.object({ date: dateStr.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const date = input?.date ?? todayStr();
      const rows = await getDb()
        .select()
        .from(meals)
        .where(and(eq(meals.spaceId, sc.space.id), eq(meals.date, date)))
        .orderBy(asc(meals.time));
      return rows
        .filter((m) => m.userId === ctx.user.id || m.visibility === "shared")
        .map((m) => ({ ...m, mine: m.userId === ctx.user.id }));
    }),

  addMeal: authedQuery
    .input(
      z.object({
        date: dateStr.optional(),
        type: z.enum(["breakfast", "lunch", "snack", "dinner", "other"]).default("other"),
        description: z.string().min(1).max(500),
        portion: z.string().max(120).nullish(),
        time: z.string().regex(/^\d{2}:\d{2}$/).nullish(),
        photoKey: z.string().max(255).nullish(),
        notes: z.string().max(500).nullish(),
        visibility: visEnum.default("shared"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const [{ id }] = await getDb()
        .insert(meals)
        .values({
          spaceId: sc.space.id,
          userId: ctx.user.id,
          date: input.date ?? todayStr(),
          type: input.type,
          description: input.description,
          portion: input.portion ?? null,
          time: input.time ?? null,
          photoKey: input.photoKey ?? null,
          notes: input.notes ?? null,
          visibility: input.visibility,
        })
        .$returningId();
      return { id };
    }),

  deleteMeal: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.meals.findFirst({ where: eq(meals.id, input.id) });
      if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(meals).where(eq(meals.id, input.id));
      return { ok: true };
    }),

  // ---------------- Workouts ----------------
  workoutList: authedQuery
    .input(z.object({ days: z.number().int().min(7).max(365).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const days = input?.days ?? 30;
      const rows = await getDb()
        .select()
        .from(workouts)
        .where(
          and(
            eq(workouts.spaceId, sc.space.id),
            gte(workouts.date, addDays(todayStr(), -(days - 1))),
          ),
        )
        .orderBy(asc(workouts.date));
      return rows
        .filter((w) => w.userId === ctx.user.id || w.visibility === "shared")
        .map((w) => ({ ...w, mine: w.userId === ctx.user.id }));
    }),

  addWorkout: authedQuery
    .input(
      z.object({
        date: dateStr.optional(),
        type: z.enum([
          "strength", "cardio", "walking", "running", "cycling",
          "mobility", "yoga", "bodyweight", "gym", "sports",
        ]),
        durationMin: z.number().int().min(1).max(1440),
        exercises: z.string().max(4000).nullish(),
        notes: z.string().max(500).nullish(),
        photoKey: z.string().max(255).nullish(),
        visibility: visEnum.default("shared"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const [{ id }] = await getDb()
        .insert(workouts)
        .values({
          spaceId: sc.space.id,
          userId: ctx.user.id,
          date: input.date ?? todayStr(),
          type: input.type,
          durationMin: input.durationMin,
          exercises: input.exercises ?? null,
          notes: input.notes ?? null,
          photoKey: input.photoKey ?? null,
          visibility: input.visibility,
        })
        .$returningId();
      return { id };
    }),

  deleteWorkout: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.workouts.findFirst({ where: eq(workouts.id, input.id) });
      if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(workouts).where(eq(workouts.id, input.id));
      return { ok: true };
    }),

  // ---------------- Daily check-in ----------------
  checkinGet: authedQuery
    .input(z.object({ date: dateStr.optional() }).optional())
    .query(async ({ ctx, input }) => {
      await requireSpace(ctx.user.id);
      return getDb().query.dailyCheckins.findFirst({
        where: and(
          eq(dailyCheckins.userId, ctx.user.id),
          eq(dailyCheckins.date, input?.date ?? todayStr()),
        ),
      });
    }),

  checkinUpsert: authedQuery
    .input(
      z.object({
        mood: z.enum(["great", "good", "okay", "low", "tired"]),
        energy: z.number().int().min(1).max(10),
        stress: z.number().int().min(1).max(10),
        mainGoal: z.string().max(255).nullish(),
        note: z.string().max(4000).nullish(),
        need: z.string().max(255).nullish(),
        visibility: visEnum.default("shared"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const db = getDb();
      const date = todayStr();
      const existing = await db.query.dailyCheckins.findFirst({
        where: and(eq(dailyCheckins.userId, ctx.user.id), eq(dailyCheckins.date, date)),
      });
      if (existing) {
        await db
          .update(dailyCheckins)
          .set({ ...input })
          .where(eq(dailyCheckins.id, existing.id));
        return { id: existing.id };
      }
      const [{ id }] = await db
        .insert(dailyCheckins)
        .values({ spaceId: sc.space.id, userId: ctx.user.id, date, ...input })
        .$returningId();
      return { id };
    }),

  checkinHistory: authedQuery
    .input(z.object({ days: z.number().int().min(7).max(90).default(14) }).optional())
    .query(async ({ ctx, input }) => {
      await requireSpace(ctx.user.id);
      const days = input?.days ?? 14;
      return getDb()
        .select()
        .from(dailyCheckins)
        .where(
          and(
            eq(dailyCheckins.userId, ctx.user.id),
            gte(dailyCheckins.date, addDays(todayStr(), -(days - 1))),
          ),
        )
        .orderBy(asc(dailyCheckins.date));
    }),

  // ---------------- Cycle (always private unless explicitly shared) ----------------
  cycleList: authedQuery.query(async ({ ctx }) => {
    await requireSpace(ctx.user.id);
    return getDb()
      .select()
      .from(cycleLogs)
      .where(eq(cycleLogs.userId, ctx.user.id))
      .orderBy(asc(cycleLogs.startDate));
  }),

  cycleAdd: authedQuery
    .input(
      z.object({
        startDate: dateStr,
        cycleLength: z.number().int().min(15).max(60).default(28),
        periodDuration: z.number().int().min(1).max(15).default(5),
        symptoms: z.string().max(500).nullish(),
        mood: z.string().max(64).nullish(),
        energy: z.number().int().min(1).max(10).nullish(),
        notes: z.string().max(4000).nullish(),
        shared: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const [{ id }] = await getDb()
        .insert(cycleLogs)
        .values({ userId: ctx.user.id, spaceId: sc.space.id, ...input })
        .$returningId();
      return { id };
    }),

  cycleDelete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.cycleLogs.findFirst({ where: eq(cycleLogs.id, input.id) });
      if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(cycleLogs).where(eq(cycleLogs.id, input.id));
      return { ok: true };
    }),
});
