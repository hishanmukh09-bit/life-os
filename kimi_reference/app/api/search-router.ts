import { z } from "zod";
import { and, eq, like, or } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  events,
  goals,
  journalEntries,
  knowledgeItems,
  lifeAdminItems,
  memories,
  shoppingItems,
  tasks,
} from "@db/schema";
import { requireSpace } from "./lib/helpers";

/** Global search across authorized records only. */
export const searchRouter = createRouter({
  query: authedQuery
    .input(z.object({ q: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const db = getDb();
      const q = `%${input.q}%`;
      const uid = ctx.user.id;
      const sid = sc.space.id;

      const canSee = (r: { userId: number; visibility: string }) =>
        r.userId === uid || r.visibility === "shared";

      const [taskRows, goalRows, journalRows, memoryRows, eventRows, knowledgeRows, shopRows, adminRows] =
        await Promise.all([
          db.select().from(tasks).where(and(eq(tasks.spaceId, sid), like(tasks.title, q))).limit(10),
          db.select().from(goals).where(and(eq(goals.spaceId, sid), like(goals.title, q))).limit(10),
          db.select().from(journalEntries).where(and(eq(journalEntries.spaceId, sid), or(like(journalEntries.title, q), like(journalEntries.content, q)))).limit(10),
          db.select().from(memories).where(and(eq(memories.spaceId, sid), like(memories.title, q))).limit(10),
          db.select().from(events).where(and(eq(events.spaceId, sid), like(events.title, q))).limit(10),
          db.select().from(knowledgeItems).where(and(eq(knowledgeItems.spaceId, sid), or(like(knowledgeItems.title, q), like(knowledgeItems.content, q)))).limit(10),
          db.select().from(shoppingItems).where(and(eq(shoppingItems.spaceId, sid), like(shoppingItems.name, q))).limit(10),
          db.select().from(lifeAdminItems).where(and(eq(lifeAdminItems.spaceId, sid), like(lifeAdminItems.title, q))).limit(10),
        ]);

      const taskLike = (r: { assigneeId: number; creatorId: number; visibility: string }) =>
        r.assigneeId === uid || (r.visibility === "shared" && r.creatorId !== uid) ||
        (r.creatorId === uid);
      void taskLike;

      return [
        ...taskRows
          .filter((t) => t.assigneeId === uid || t.creatorId === uid || t.visibility === "shared")
          .map((t) => ({ type: "task" as const, id: t.id, title: t.title, detail: t.dueDate ?? "", to: "/tasks" })),
        ...goalRows
          .filter((g) => g.creatorId === uid || g.visibility === "shared" || g.category === "us")
          .map((g) => ({ type: "goal" as const, id: g.id, title: g.title, detail: `${g.progress}%`, to: "/goals" })),
        ...journalRows
          .filter((j) => j.userId === uid || j.visibility === "shared")
          .map((j) => ({ type: "journal" as const, id: j.id, title: j.title ?? j.content.slice(0, 60), detail: j.date, to: "/journal" })),
        ...memoryRows.map((m) => ({ type: "memory" as const, id: m.id, title: m.title, detail: m.date, to: "/memories" })),
        ...eventRows
          .filter(canSee)
          .map((e) => ({ type: "event" as const, id: e.id, title: e.title, detail: e.date, to: "/life-admin" })),
        ...knowledgeRows
          .filter(canSee)
          .map((k) => ({ type: "knowledge" as const, id: k.id, title: k.title, detail: k.type, to: "/life-admin" })),
        ...shopRows.map((s) => ({ type: "shopping" as const, id: s.id, title: s.name, detail: s.done ? "bought" : "to buy", to: "/life-admin" })),
        ...adminRows
          .filter(canSee)
          .map((a) => ({ type: "life_admin" as const, id: a.id, title: a.title, detail: a.category, to: "/life-admin" })),
      ].slice(0, 20);
    }),
});
