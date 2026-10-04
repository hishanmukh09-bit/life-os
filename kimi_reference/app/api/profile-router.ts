import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { profiles } from "@db/schema";
import { getOrCreateProfile, requireSpace } from "./lib/helpers";

const profileInput = z.object({
  displayName: z.string().max(120).nullish(),
  avatarKey: z.string().max(255).nullish(),
  dateOfBirth: z.string().max(10).nullish(),
  gender: z.string().max(32).nullish(),
  heightCm: z.number().int().min(50).max(280).nullish(),
  weightKg: z.number().int().min(20).max(500).nullish(),
  fitnessGoal: z.string().max(255).nullish(),
  activityLevel: z.string().max(64).nullish(),
  equipment: z.string().max(255).nullish(),
  workoutPrefMin: z.number().int().min(5).max(600).nullish(),
  sleepTargetMin: z.number().int().min(120).max(960).nullish(),
  wakeTarget: z.string().max(5).nullish(),
  waterTargetMl: z.number().int().min(250).max(10000).nullish(),
  studyTargetMin: z.number().int().min(5).max(1440).nullish(),
  diet: z.string().max(64).nullish(),
  allergies: z.string().nullish(),
  dislikedFoods: z.string().nullish(),
  favoriteFoods: z.string().nullish(),
  occupation: z.string().max(120).nullish(),
  subjects: z.string().nullish(),
  planningStyle: z.string().max(64).nullish(),
  accent: z.string().max(32).nullish(),
  theme: z.enum(["light", "dark", "system"]).nullish(),
  quietHoursStart: z.string().max(5).nullish(),
  quietHoursEnd: z.string().max(5).nullish(),
  customMessages: z.string().nullish(),
});

export const profileRouter = createRouter({
  me: authedQuery.query(({ ctx }) => getOrCreateProfile(ctx.user.id)),

  update: authedQuery
    .input(profileInput)
    .mutation(async ({ ctx, input }) => {
      await getOrCreateProfile(ctx.user.id);
      const clean = Object.fromEntries(
        Object.entries(input).filter(([, v]) => v !== undefined),
      );
      await getDb()
        .update(profiles)
        .set(clean)
        .where(eq(profiles.userId, ctx.user.id));
      return { ok: true };
    }),

  /** Partner's basic info — name/avatar only. Wellness data is never shared here. */
  partner: authedQuery.query(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    return sc.partner;
  }),
});
