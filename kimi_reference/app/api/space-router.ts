import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { spaceMembers, spaces } from "@db/schema";
import { getSpaceContext, getOrCreateProfile } from "./lib/helpers";

export const spaceRouter = createRouter({
  /** Current space state: null if the user has no space yet. */
  get: authedQuery.query(async ({ ctx }) => {
    const sc = await getSpaceContext(ctx.user.id);
    if (!sc) return null;
    return {
      space: sc.space,
      myRole: sc.membership.role,
      memberCount: sc.members.length,
      partner: sc.partner,
    };
  }),

  create: authedQuery
    .input(z.object({ name: z.string().min(1).max(120).optional() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getSpaceContext(ctx.user.id);
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already belong to a space.",
        });
      }
      const db = getDb();
      const [{ id }] = await db
        .insert(spaces)
        .values({
          name: input.name ?? "Our Space",
          inviteCode: nanoid(10),
          ownerId: ctx.user.id,
        })
        .$returningId();
      await db.insert(spaceMembers).values({
        spaceId: id,
        userId: ctx.user.id,
        role: "owner",
      });
      await getOrCreateProfile(ctx.user.id);
      return { id };
    }),

  join: authedQuery
    .input(z.object({ inviteCode: z.string().min(4).max(16) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getSpaceContext(ctx.user.id);
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already belong to a space.",
        });
      }
      const db = getDb();
      const space = await db.query.spaces.findFirst({
        where: eq(spaces.inviteCode, input.inviteCode.trim()),
      });
      if (!space) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "That invite code doesn't match any space.",
        });
      }
      const members = await db
        .select()
        .from(spaceMembers)
        .where(eq(spaceMembers.spaceId, space.id));
      if (members.length >= 2) {
        // Server-enforced two-person limit.
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This space is full. LIFE OS spaces are for exactly two people.",
        });
      }
      await db.insert(spaceMembers).values({
        spaceId: space.id,
        userId: ctx.user.id,
        role: "partner",
      });
      await getOrCreateProfile(ctx.user.id);
      return { id: space.id };
    }),

  regenerateCode: authedQuery.mutation(async ({ ctx }) => {
    const sc = await getSpaceContext(ctx.user.id);
    if (!sc || sc.membership.role !== "owner") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const code = nanoid(10);
    await getDb()
      .update(spaces)
      .set({ inviteCode: code })
      .where(eq(spaces.id, sc.space.id));
    return { inviteCode: code };
  }),

  /** Owner can remove the partner; a member can also leave. */
  removeMember: authedQuery
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const sc = await getSpaceContext(ctx.user.id);
      if (!sc) throw new TRPCError({ code: "PRECONDITION_FAILED" });
      const isSelf = input.userId === ctx.user.id;
      const isOwner = sc.membership.role === "owner";
      if (!isSelf && !isOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the space owner can remove a member.",
        });
      }
      await getDb()
        .delete(spaceMembers)
        .where(eq(spaceMembers.id, 
          sc.members.find((m) => m.userId === input.userId)?.id ?? -1,
        ));
      return { ok: true };
    }),
});
