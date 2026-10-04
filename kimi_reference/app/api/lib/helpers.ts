import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { profiles, spaceMembers, spaces, users } from "@db/schema";

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return todayStr(d);
}

/** Returns the caller's space, their membership, and (if present) the partner. */
export async function getSpaceContext(userId: number) {
  const db = getDb();
  const membership = await db.query.spaceMembers.findFirst({
    where: eq(spaceMembers.userId, userId),
  });
  if (!membership) return null;
  const space = await db.query.spaces.findFirst({
    where: eq(spaces.id, membership.spaceId),
  });
  if (!space) return null;
  const members = await db
    .select()
    .from(spaceMembers)
    .where(eq(spaceMembers.spaceId, space.id));
  const partnerMember = members.find((m) => m.userId !== userId) ?? null;
  let partner = null as null | {
    id: number;
    name: string | null;
    avatar: string | null;
    displayName: string | null;
    avatarKey: string | null;
    role: string;
  };
  if (partnerMember) {
    const u = await db.query.users.findFirst({
      where: eq(users.id, partnerMember.userId),
    });
    const p = await db.query.profiles.findFirst({
      where: eq(profiles.userId, partnerMember.userId),
    });
    partner = {
      id: partnerMember.userId,
      name: u?.name ?? null,
      avatar: u?.avatar ?? null,
      displayName: p?.displayName ?? null,
      avatarKey: p?.avatarKey ?? null,
      role: partnerMember.role,
    };
  }
  return { space, membership, members, partner };
}

export async function requireSpace(userId: number) {
  const ctx = await getSpaceContext(userId);
  if (!ctx) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "NO_SPACE",
    });
  }
  return ctx;
}

/**
 * Privacy guard: a record is visible to the caller if they own it,
 * or it is marked shared. Sensitive records never leave this rule.
 */
export function isVisibleTo(
  record: { userId: number; visibility: string },
  viewerId: number,
): boolean {
  return record.userId === viewerId || record.visibility === "shared";
}

/** Filter a list of owned records down to what the viewer may see. */
export function filterVisible<T extends { userId: number; visibility: string }>(
  rows: T[],
  viewerId: number,
): T[] {
  return rows.filter((r) => isVisibleTo(r, viewerId));
}

/** Ensure the caller may read a record that lives inside their space. */
export function assertCanView<T extends { userId: number; visibility: string }>(
  record: T | undefined | null,
  viewerId: number,
): T {
  if (!record) throw new TRPCError({ code: "NOT_FOUND" });
  if (!isVisibleTo(record, viewerId)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "This item is private." });
  }
  return record;
}

/** Mutations on someone else's record are never allowed. */
export function assertOwner<T extends { userId: number }>(
  record: T | undefined | null,
  viewerId: number,
): T {
  if (!record) throw new TRPCError({ code: "NOT_FOUND" });
  if (record.userId !== viewerId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not your item." });
  }
  return record;
}

export async function getOrCreateProfile(userId: number) {
  const db = getDb();
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });
  if (existing) return existing;
  await db.insert(profiles).values({ userId });
  return (await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  }))!;
}

export { and, eq };
