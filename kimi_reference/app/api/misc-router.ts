import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { events, knowledgeItems, lifeAdminItems, shoppingItems } from "@db/schema";
import { requireSpace } from "./lib/helpers";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const visEnum = z.enum(["private", "shared"]);

export const miscRouter = createRouter({
  // ---------------- Shopping list (shared, realtime-ish via polling) ----------------
  shoppingList: authedQuery.query(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    return getDb()
      .select()
      .from(shoppingItems)
      .where(eq(shoppingItems.spaceId, sc.space.id))
      .orderBy(asc(shoppingItems.createdAt));
  }),

  shoppingAdd: authedQuery
    .input(z.object({ name: z.string().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const [{ id }] = await getDb()
        .insert(shoppingItems)
        .values({ spaceId: sc.space.id, addedBy: ctx.user.id, name: input.name })
        .$returningId();
      return { id };
    }),

  shoppingToggle: authedQuery
    .input(z.object({ id: z.number(), done: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const db = getDb();
      const row = await db.query.shoppingItems.findFirst({
        where: eq(shoppingItems.id, input.id),
      });
      if (!row || row.spaceId !== sc.space.id) throw new TRPCError({ code: "NOT_FOUND" });
      await db
        .update(shoppingItems)
        .set({ done: input.done })
        .where(eq(shoppingItems.id, input.id));
      return { ok: true };
    }),

  shoppingDelete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const db = getDb();
      const row = await db.query.shoppingItems.findFirst({
        where: eq(shoppingItems.id, input.id),
      });
      if (!row || row.spaceId !== sc.space.id) throw new TRPCError({ code: "NOT_FOUND" });
      await db.delete(shoppingItems).where(eq(shoppingItems.id, input.id));
      return { ok: true };
    }),

  // ---------------- Life admin ----------------
  lifeAdminList: authedQuery.query(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    const rows = await getDb()
      .select()
      .from(lifeAdminItems)
      .where(eq(lifeAdminItems.spaceId, sc.space.id))
      .orderBy(asc(lifeAdminItems.dueDate));
    return rows
      .filter((r) => r.userId === ctx.user.id || r.visibility === "shared")
      .map((r) => ({ ...r, mine: r.userId === ctx.user.id }));
  }),

  lifeAdminAdd: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(200),
        category: z.enum([
          "bills", "payments", "documents", "renewals",
          "appointments", "repairs", "purchases", "other",
        ]).default("other"),
        dueDate: dateStr.nullish(),
        notes: z.string().max(500).nullish(),
        visibility: visEnum.default("shared"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const [{ id }] = await getDb()
        .insert(lifeAdminItems)
        .values({
          spaceId: sc.space.id,
          userId: ctx.user.id,
          title: input.title,
          category: input.category,
          dueDate: input.dueDate ?? null,
          notes: input.notes ?? null,
          visibility: input.visibility,
        })
        .$returningId();
      return { id };
    }),

  lifeAdminToggle: authedQuery
    .input(z.object({ id: z.number(), done: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.lifeAdminItems.findFirst({
        where: eq(lifeAdminItems.id, input.id),
      });
      if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db
        .update(lifeAdminItems)
        .set({ done: input.done })
        .where(eq(lifeAdminItems.id, input.id));
      return { ok: true };
    }),

  lifeAdminDelete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.lifeAdminItems.findFirst({
        where: eq(lifeAdminItems.id, input.id),
      });
      if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(lifeAdminItems).where(eq(lifeAdminItems.id, input.id));
      return { ok: true };
    }),

  // ---------------- Knowledge vault / little things / remember ----------------
  knowledgeList: authedQuery
    .input(z.object({ type: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const rows = await getDb()
        .select()
        .from(knowledgeItems)
        .where(eq(knowledgeItems.spaceId, sc.space.id))
        .orderBy(asc(knowledgeItems.createdAt));
      return rows
        .filter((r) => r.userId === ctx.user.id || r.visibility === "shared")
        .filter((r) => !input?.type || r.type === input.type)
        .map((r) => ({ ...r, mine: r.userId === ctx.user.id }));
    }),

  knowledgeAdd: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().max(8000).nullish(),
        url: z.string().max(500).nullish(),
        type: z.enum([
          "learned", "link", "idea", "project_idea", "book",
          "research", "note", "little_thing", "remember",
        ]).default("note"),
        aboutPartner: z.boolean().default(false),
        visibility: visEnum.default("private"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const [{ id }] = await getDb()
        .insert(knowledgeItems)
        .values({ spaceId: sc.space.id, userId: ctx.user.id, ...input })
        .$returningId();
      return { id };
    }),

  knowledgeDelete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.knowledgeItems.findFirst({
        where: eq(knowledgeItems.id, input.id),
      });
      if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(knowledgeItems).where(eq(knowledgeItems.id, input.id));
      return { ok: true };
    }),

  // ---------------- Events ----------------
  eventList: authedQuery.query(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    const rows = await getDb()
      .select()
      .from(events)
      .where(eq(events.spaceId, sc.space.id))
      .orderBy(asc(events.date));
    return rows
      .filter((r) => r.userId === ctx.user.id || r.visibility === "shared")
      .map((r) => ({ ...r, mine: r.userId === ctx.user.id }));
  }),

  eventAdd: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(200),
        type: z.enum([
          "birthday", "anniversary", "exam", "trip",
          "appointment", "deadline", "milestone", "other",
        ]).default("other"),
        date: dateStr,
        notes: z.string().max(500).nullish(),
        visibility: visEnum.default("shared"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const [{ id }] = await getDb()
        .insert(events)
        .values({
          spaceId: sc.space.id,
          userId: ctx.user.id,
          title: input.title,
          type: input.type,
          date: input.date,
          notes: input.notes ?? null,
          visibility: input.visibility,
        })
        .$returningId();
      return { id };
    }),

  eventDelete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.events.findFirst({ where: eq(events.id, input.id) });
      if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(events).where(eq(events.id, input.id));
      return { ok: true };
    }),
});
