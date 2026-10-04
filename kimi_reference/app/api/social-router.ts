import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  dailyCheckins,
  encouragements,
  notifications,
  sleepLogs,
  tasks,
  workouts,
} from "@db/schema";
import { requireSpace, todayStr } from "./lib/helpers";

export const socialRouter = createRouter({
  /**
   * CHECK ON THEM — only what the partner explicitly shared.
   * Private records are invisible here by construction.
   */
  partnerStatus: authedQuery.query(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    if (!sc.partner) return { partner: null };
    const db = getDb();
    const pid = sc.partner.id;
    const today = todayStr();

    const checkin = await db.query.dailyCheckins.findFirst({
      where: and(eq(dailyCheckins.userId, pid), eq(dailyCheckins.date, today)),
    });
    const sharedCheckin =
      checkin && checkin.visibility === "shared"
        ? {
            mood: checkin.mood,
            energy: checkin.energy,
            stress: checkin.stress,
            mainGoal: checkin.mainGoal,
            need: checkin.need,
          }
        : null;

    const partnerTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.spaceId, sc.space.id),
          eq(tasks.assigneeId, pid),
          eq(tasks.dueDate, today),
          eq(tasks.visibility, "shared"),
        ),
      );
    const done = partnerTasks.filter((t) => t.status === "done").length;

    const sleep = await db.query.sleepLogs.findFirst({
      where: and(eq(sleepLogs.userId, pid), eq(sleepLogs.date, today)),
    });
    const sharedSleep =
      sleep && sleep.visibility === "shared"
        ? { durationMin: sleep.durationMin, quality: sleep.quality }
        : null;

    const workoutRows = await db
      .select()
      .from(workouts)
      .where(
        and(
          eq(workouts.userId, pid),
          eq(workouts.date, today),
          eq(workouts.visibility, "shared"),
        ),
      );

    return {
      partner: sc.partner,
      checkin: sharedCheckin,
      tasks: { done, total: partnerTasks.length },
      sleep: sharedSleep,
      workoutLogged: workoutRows.length > 0,
    };
  }),

  sendEncouragement: authedQuery
    .input(z.object({ message: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      if (!sc.partner) throw new TRPCError({ code: "BAD_REQUEST", message: "No partner yet." });
      const db = getDb();
      await db.insert(encouragements).values({
        spaceId: sc.space.id,
        fromUserId: ctx.user.id,
        toUserId: sc.partner.id,
        kind: "encouragement",
        message: input.message,
      });
      await db.insert(notifications).values({
        spaceId: sc.space.id,
        userId: sc.partner.id,
        type: "encouragement",
        title: "Encouragement received",
        body: input.message,
      });
      return { ok: true };
    }),

  iNeedHelp: authedQuery
    .input(
      z.object({
        category: z.enum([
          "study", "workout", "productivity", "technical",
          "time_management", "overwhelmed", "food", "just_need_someone",
        ]),
        message: z.string().max(500).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      if (!sc.partner) throw new TRPCError({ code: "BAD_REQUEST", message: "No partner yet." });
      const db = getDb();
      const label = input.category.replace(/_/g, " ");
      const message = input.message ?? `Could use a hand with ${label}.`;
      await db.insert(encouragements).values({
        spaceId: sc.space.id,
        fromUserId: ctx.user.id,
        toUserId: sc.partner.id,
        kind: "help_request",
        category: input.category,
        message,
      });
      await db.insert(notifications).values({
        spaceId: sc.space.id,
        userId: sc.partner.id,
        type: "help_request",
        title: "Help requested",
        body: message,
      });
      return { ok: true };
    }),

  inbox: authedQuery.query(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    const rows = await getDb()
      .select()
      .from(encouragements)
      .where(eq(encouragements.spaceId, sc.space.id))
      .orderBy(desc(encouragements.createdAt))
      .limit(50);
    return rows.map((r) => ({
      ...r,
      incoming: r.toUserId === ctx.user.id,
    }));
  }),

  markRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.encouragements.findFirst({
        where: eq(encouragements.id, input.id),
      });
      if (!row || row.toUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db
        .update(encouragements)
        .set({ read: true })
        .where(eq(encouragements.id, input.id));
      return { ok: true };
    }),

  notifications: authedQuery.query(async ({ ctx }) => {
    await requireSpace(ctx.user.id);
    return getDb()
      .select()
      .from(notifications)
      .where(eq(notifications.userId, ctx.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(30);
  }),

  markNotificationRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.notifications.findFirst({
        where: eq(notifications.id, input.id),
      });
      if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.update(notifications).set({ read: true }).where(eq(notifications.id, input.id));
      return { ok: true };
    }),

  unreadCount: authedQuery.query(async ({ ctx }) => {
    const rows = await getDb()
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.read, false)));
    return { count: rows.length };
  }),
});
