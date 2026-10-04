import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, ne } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { tasks, taskCategory, taskPriority, recurrence } from "@db/schema";
import { addDays, requireSpace, todayStr } from "./lib/helpers";

const categoryEnum = z.enum(taskCategory);
const priorityEnum = z.enum(taskPriority);
const recurrenceEnum = z.enum(recurrence);

const taskInput = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(4000).nullish(),
  category: categoryEnum.default("personal"),
  priority: priorityEnum.default("normal"),
  visibility: z.enum(["private", "shared"]).default("shared"),
  assigneeId: z.number().nullish(), // defaults to self
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).nullish(),
  recurrence: recurrenceEnum.default("none"),
  estimatedMin: z.number().int().min(1).max(1440).nullish(),
  proofRequired: z.boolean().default(false),
  notes: z.string().max(2000).nullish(),
});

/** Does a recurrence rule produce an instance on `date`? */
export function occursOn(rec: string, dateStr: string, anchorDate: string): boolean {
  if (rec === "none") return false;
  const d = new Date(dateStr + "T00:00:00");
  const anchor = new Date(anchorDate + "T00:00:00");
  if (d < anchor) return false;
  const dow = d.getDay(); // 0 Sun
  switch (rec) {
    case "daily":
      return true;
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "weekends":
      return dow === 0 || dow === 6;
    case "weekly":
      return d.getDay() === anchor.getDay();
    case "monthly":
      return d.getDate() === anchor.getDate();
    default:
      return false;
  }
}

/** Materialize recurring tasks: create today's instances for recurring series. */
async function materializeRecurrence(spaceId: number, date: string) {
  const db = getDb();
  const recurring = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.spaceId, spaceId),
        ne(tasks.recurrence, "none"),
        ne(tasks.status, "archived"),
        lte(tasks.dueDate, date),
      ),
    );
  // Only consider "template" rows: the original of each series.
  const templates = recurring.filter((t) => t.seriesId && t.dueDate !== date);
  const seen = new Set<string>();
  const uniqueTemplates = templates.filter((t) => {
    if (seen.has(t.seriesId!)) return false;
    seen.add(t.seriesId!);
    return true;
  });
  const existingToday = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.spaceId, spaceId), eq(tasks.dueDate, date)));
  const todaySeries = new Set(
    existingToday.map((t) => t.seriesId).filter(Boolean) as string[],
  );
  for (const tpl of uniqueTemplates) {
    if (todaySeries.has(tpl.seriesId!)) continue; // no duplicates
    if (!occursOn(tpl.recurrence, date, tpl.dueDate!)) continue;
    await db.insert(tasks).values({
      spaceId: tpl.spaceId,
      creatorId: tpl.creatorId,
      assigneeId: tpl.assigneeId,
      title: tpl.title,
      description: tpl.description,
      category: tpl.category,
      priority: tpl.priority,
      visibility: tpl.visibility,
      dueDate: date,
      dueTime: tpl.dueTime,
      recurrence: "none", // instances are one-off
      estimatedMin: tpl.estimatedMin,
      proofRequired: tpl.proofRequired,
      seriesId: tpl.seriesId,
    });
    todaySeries.add(tpl.seriesId!);
  }
}

export const taskRouter = createRouter({
  /** My tasks + partner's shared tasks for a date range (default: today). */
  list: authedQuery
    .input(
      z.object({
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        mine: z.boolean().default(false),
        status: z.enum(["todo", "done", "archived", "all"]).default("all"),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const today = todayStr();
      await materializeRecurrence(sc.space.id, today);
      const db = getDb();
      const rows = await db
        .select()
        .from(tasks)
        .where(eq(tasks.spaceId, sc.space.id))
        .orderBy(desc(tasks.createdAt));
      const from = input?.from;
      const to = input?.to;
      return rows.filter((t) => {
        const mine = t.assigneeId === ctx.user.id;
        if (input?.mine && !mine) return false;
        if (!mine && t.visibility !== "shared") return false; // privacy
        if (!mine && t.assigneeId !== sc.partner?.id) return false;
        if (input?.status && input.status !== "all" && t.status !== input.status)
          return false;
        if (from && (!t.dueDate || t.dueDate < from)) return false;
        if (to && (!t.dueDate || t.dueDate > to)) return false;
        return true;
      });
    }),

  create: authedQuery.input(taskInput).mutation(async ({ ctx, input }) => {
    const sc = await requireSpace(ctx.user.id);
    const assigneeId = input.assigneeId ?? ctx.user.id;
    const validAssignee =
      assigneeId === ctx.user.id || assigneeId === sc.partner?.id;
    if (!validAssignee) throw new TRPCError({ code: "FORBIDDEN" });
    if (assigneeId !== ctx.user.id && input.visibility !== "shared") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A task assigned to your partner must be shared.",
      });
    }
    const seriesId =
      input.recurrence !== "none" ? nanoid(12) : null;
    const [{ id }] = await getDb()
      .insert(tasks)
      .values({
        spaceId: sc.space.id,
        creatorId: ctx.user.id,
        assigneeId,
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        priority: input.priority,
        visibility: input.visibility,
        dueDate: input.dueDate ?? todayStr(),
        dueTime: input.dueTime ?? null,
        recurrence: input.recurrence,
        estimatedMin: input.estimatedMin ?? null,
        proofRequired: input.proofRequired,
        notes: input.notes ?? null,
        seriesId,
      })
      .$returningId();
    return { id };
  }),

  update: authedQuery
    .input(taskInput.partial().extend({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const db = getDb();
      const { id, ...patch } = input;
      const row = await db.query.tasks.findFirst({ where: eq(tasks.id, id) });
      if (!row || row.spaceId !== sc.space.id)
        throw new TRPCError({ code: "NOT_FOUND" });
      const involved =
        row.assigneeId === ctx.user.id || row.creatorId === ctx.user.id;
      if (!involved) throw new TRPCError({ code: "FORBIDDEN" });
      const clean = Object.fromEntries(
        Object.entries(patch).filter(([, v]) => v !== undefined),
      );
      await db.update(tasks).set(clean).where(eq(tasks.id, id));
      return { ok: true };
    }),

  complete: authedQuery
    .input(
      z.object({
        id: z.number(),
        done: z.boolean().default(true),
        proofKey: z.string().max(255).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const db = getDb();
      const row = await db.query.tasks.findFirst({
        where: eq(tasks.id, input.id),
      });
      if (!row || row.spaceId !== sc.space.id)
        throw new TRPCError({ code: "NOT_FOUND" });
      if (row.assigneeId !== ctx.user.id)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the assigned person can complete this task.",
        });
      await db
        .update(tasks)
        .set({
          status: input.done ? "done" : "todo",
          completedAt: input.done ? new Date() : null,
          proofKey: input.proofKey ?? row.proofKey,
        })
        .where(eq(tasks.id, input.id));
      return { ok: true };
    }),

  /** Move a task to another day; tracks repeated postponement for AI insights. */
  postpone: authedQuery
    .input(z.object({ id: z.number(), toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const db = getDb();
      const row = await db.query.tasks.findFirst({
        where: eq(tasks.id, input.id),
      });
      if (!row || row.spaceId !== sc.space.id)
        throw new TRPCError({ code: "NOT_FOUND" });
      if (row.assigneeId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });
      await db
        .update(tasks)
        .set({ dueDate: input.toDate, postponeCount: row.postponeCount + 1 })
        .where(eq(tasks.id, input.id));
      return { ok: true, postponeCount: row.postponeCount + 1 };
    }),

  remove: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const db = getDb();
      const row = await db.query.tasks.findFirst({
        where: eq(tasks.id, input.id),
      });
      if (!row || row.spaceId !== sc.space.id)
        throw new TRPCError({ code: "NOT_FOUND" });
      if (row.creatorId !== ctx.user.id && row.assigneeId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(tasks).where(eq(tasks.id, input.id));
      return { ok: true };
    }),

  /** Deadline radar data: open tasks with due dates, bucketed by urgency. */
  radar: authedQuery.query(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    const today = todayStr();
    const db = getDb();
    const rows = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.spaceId, sc.space.id),
          eq(tasks.assigneeId, ctx.user.id),
          eq(tasks.status, "todo"),
          gte(tasks.dueDate, today),
          lte(tasks.dueDate, addDays(today, 14)),
        ),
      );
    const bucket = (d: string | null) => {
      if (!d) return "green";
      if (d <= addDays(today, 1)) return "red";
      if (d <= addDays(today, 3)) return "orange";
      if (d <= addDays(today, 7)) return "yellow";
      return "green";
    };
    return rows
      .map((t) => ({ ...t, urgency: bucket(t.dueDate) }))
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  }),
});
