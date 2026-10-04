import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { goalMilestones, goals } from "@db/schema";
import { requireSpace } from "./lib/helpers";

const goalInput = z.object({
  title: z.string().min(1).max(200),
  category: z.enum([
    "academics", "career", "fitness", "projects", "reading",
    "skills", "financial", "personal", "us",
  ]).default("personal"),
  description: z.string().max(4000).nullish(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  visibility: z.enum(["private", "shared"]).default("private"),
});

export const goalRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    const db = getDb();
    const rows = await db.select().from(goals).where(eq(goals.spaceId, sc.space.id));
    const visible = rows.filter(
      (g) =>
        g.creatorId === ctx.user.id ||
        g.visibility === "shared" ||
        g.category === "us",
    );
    const ids = visible.map((g) => g.id);
    const milestones = ids.length
      ? await db.select().from(goalMilestones).where(inArray(goalMilestones.goalId, ids))
      : [];
    return visible.map((g) => ({
      ...g,
      mine: g.creatorId === ctx.user.id,
      milestones: milestones.filter((m) => m.goalId === g.id),
    }));
  }),

  create: authedQuery
    .input(goalInput.extend({ milestones: z.array(z.string().min(1).max(200)).max(20).default([]) }))
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const db = getDb();
      // "us" goals are always shared between the two members.
      const visibility = input.category === "us" ? "shared" : input.visibility;
      const [{ id }] = await db
        .insert(goals)
        .values({
          spaceId: sc.space.id,
          creatorId: ctx.user.id,
          title: input.title,
          category: input.category,
          description: input.description ?? null,
          targetDate: input.targetDate ?? null,
          visibility,
        })
        .$returningId();
      if (input.milestones.length) {
        await db.insert(goalMilestones).values(
          input.milestones.map((title) => ({ goalId: id, title })),
        );
      }
      return { id };
    }),

  update: authedQuery
    .input(
      goalInput.partial().extend({
        id: z.number(),
        progress: z.number().int().min(0).max(100).optional(),
        status: z.enum(["active", "done", "paused"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const db = getDb();
      const { id, ...patch } = input;
      const row = await db.query.goals.findFirst({ where: eq(goals.id, id) });
      if (!row || row.spaceId !== sc.space.id) throw new TRPCError({ code: "NOT_FOUND" });
      // Personal goals: creator only. "us" goals: either member may update.
      const canEdit = row.creatorId === ctx.user.id || row.category === "us";
      if (!canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      if (patch.category === "us") patch.visibility = "shared";
      const clean = Object.fromEntries(
        Object.entries(patch).filter(([, v]) => v !== undefined),
      );
      await db.update(goals).set(clean).where(eq(goals.id, id));
      return { ok: true };
    }),

  toggleMilestone: authedQuery
    .input(z.object({ id: z.number(), done: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const db = getDb();
      const m = await db.query.goalMilestones.findFirst({
        where: eq(goalMilestones.id, input.id),
      });
      if (!m) throw new TRPCError({ code: "NOT_FOUND" });
      const goal = await db.query.goals.findFirst({ where: eq(goals.id, m.goalId) });
      if (!goal || goal.spaceId !== sc.space.id) throw new TRPCError({ code: "NOT_FOUND" });
      if (goal.creatorId !== ctx.user.id && goal.category !== "us")
        throw new TRPCError({ code: "FORBIDDEN" });
      await db
        .update(goalMilestones)
        .set({ done: input.done, doneAt: input.done ? new Date() : null })
        .where(eq(goalMilestones.id, input.id));
      return { ok: true };
    }),

  remove: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.goals.findFirst({ where: eq(goals.id, input.id) });
      if (!row || row.creatorId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(goalMilestones).where(eq(goalMilestones.goalId, input.id));
      await db.delete(goals).where(eq(goals.id, input.id));
      return { ok: true };
    }),
});
