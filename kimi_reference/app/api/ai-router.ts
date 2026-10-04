import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import { generateText } from "ai";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  aiMessages,
  dailyCheckins,
  exams,
  goals,
  habitLogs,
  habits,
  meals,
  profiles,
  sleepLogs,
  studySessions,
  studySubjects,
  tasks,
  waterLogs,
  workouts,
} from "@db/schema";
import { addDays, requireSpace, todayStr } from "./lib/helpers";
import { classifyAiError } from "./lib/ai-client";
import { defaultModel, kimiGw } from "./ai/provider";

async function buildUserContext(userId: number, spaceId: number) {
  const db = getDb();
  const today = todayStr();
  const week = addDays(today, -6);

  const [profile, myTasks, myHabits, hLogs, water, sleep, mealRows, workoutRows, subjects, sessions, examRows, goalRows, checkin] =
    await Promise.all([
      db.query.profiles.findFirst({ where: eq(profiles.userId, userId) }),
      db
        .select()
        .from(tasks)
        .where(and(eq(tasks.spaceId, spaceId), eq(tasks.assigneeId, userId), gte(tasks.dueDate, week))),
      db.select().from(habits).where(and(eq(habits.userId, userId), eq(habits.archived, false))),
      db.select().from(habitLogs).where(and(eq(habitLogs.userId, userId), gte(habitLogs.date, week))),
      db.select().from(waterLogs).where(and(eq(waterLogs.userId, userId), eq(waterLogs.date, today))),
      db.select().from(sleepLogs).where(and(eq(sleepLogs.userId, userId), gte(sleepLogs.date, addDays(today, -3)))),
      db.select().from(meals).where(and(eq(meals.userId, userId), eq(meals.date, today))),
      db.select().from(workouts).where(and(eq(workouts.userId, userId), gte(workouts.date, week))),
      db.select().from(studySubjects).where(eq(studySubjects.userId, userId)),
      db.select().from(studySessions).where(and(eq(studySessions.userId, userId), gte(studySessions.date, week))),
      db.select().from(exams).where(and(eq(exams.userId, userId), gte(exams.date, today))).orderBy(asc(exams.date)),
      db.select().from(goals).where(and(eq(goals.spaceId, spaceId), eq(goals.creatorId, userId), eq(goals.status, "active"))),
      db.query.dailyCheckins.findFirst({
        where: and(eq(dailyCheckins.userId, userId), eq(dailyCheckins.date, today)),
      }),
    ]);

  const openToday = myTasks.filter((t) => t.status === "todo" && t.dueDate === today);
  const overdue = myTasks.filter((t) => t.status === "todo" && t.dueDate! < today);
  const doneToday = myTasks.filter((t) => t.status === "done" && t.dueDate === today);
  const studyWeekMin = sessions.reduce((s, r) => s + r.durationMin, 0);
  const waterToday = water.reduce((s, r) => s + r.amountMl, 0);
  const lastSleep = sleep[sleep.length - 1];

  const lines: string[] = [];
  lines.push(`Today: ${today}. Current user profile: ${profile?.displayName ?? "user"}.`);
  if (profile) {
    if (profile.wakeTarget) lines.push(`Wake target: ${profile.wakeTarget}. Sleep target: ${profile.sleepTargetMin} min. Water target: ${profile.waterTargetMl} ml. Study target: ${profile.studyTargetMin} min/day.`);
    if (profile.diet) lines.push(`Diet: ${profile.diet}. Allergies: ${profile.allergies ?? "none"}. Dislikes: ${profile.dislikedFoods ?? "none"}. Favorites: ${profile.favoriteFoods ?? "none"}.`);
    if (profile.fitnessGoal) lines.push(`Fitness goal: ${profile.fitnessGoal}. Activity level: ${profile.activityLevel ?? "unknown"}. Equipment: ${profile.equipment ?? "unknown"}. Preferred workout: ${profile.workoutPrefMin ?? "?"} min.`);
  }
  if (checkin) lines.push(`Today's check-in: mood ${checkin.mood}, energy ${checkin.energy}/10, stress ${checkin.stress}/10, main goal: ${checkin.mainGoal ?? "—"}.`);
  lines.push(
    `Open tasks today (${openToday.length}): ` +
      (openToday.map((t) => `"${t.title}" (${t.priority}, ${t.estimatedMin ?? "?"}min, postponed ${t.postponeCount}x)`).join("; ") || "none"),
  );
  lines.push(`Overdue (${overdue.length}): ` + (overdue.map((t) => `"${t.title}" due ${t.dueDate} (${t.priority}, ${t.estimatedMin ?? "?"}min)`).join("; ") || "none"));
  lines.push(`Completed today: ${doneToday.length}.`);
  lines.push(`Habits: ${myHabits.map((h) => `${h.name} (${hLogs.filter((l) => l.habitId === h.id && l.date === today).length ? "done today" : "not yet"})`).join("; ") || "none"}.`);
  lines.push(`Water today: ${waterToday} ml. Last sleep: ${lastSleep ? `${lastSleep.durationMin ?? "?"} min, quality ${lastSleep.quality ?? "?"}/5` : "not logged"}.`);
  lines.push(`Meals today: ${mealRows.map((m) => `${m.type}: ${m.description}`).join("; ") || "none logged"}.`);
  lines.push(`Workouts this week: ${workoutRows.length} (${workoutRows.map((w) => `${w.type} ${w.durationMin}min`).join("; ") || "none"}).`);
  lines.push(`Study this week: ${studyWeekMin} min. Subjects: ${subjects.map((s) => s.name).join(", ") || "none"}.`);
  lines.push(`Upcoming exams: ${examRows.map((e) => `"${e.title}" (${e.subject ?? "?"}) on ${e.date}`).join("; ") || "none"}.`);
  lines.push(`Active goals: ${goalRows.map((g) => `"${g.title}" ${g.progress}% (due ${g.targetDate ?? "—"})`).join("; ") || "none"}.`);
  return lines.join("\n");
}

const SYSTEM_COACH = `You are "Coach", the quiet, warm planning assistant inside LIFE OS, a private two-person life-management app.
Rules:
- Be concise, kind, specific. Never shame, never guilt-trip. Accountability, not surveillance.
- Ground every claim in the data provided. Never invent tasks, dates or numbers.
- No medical diagnoses, no medication advice, no extreme dieting or unsafe exercise.
- If nutrition is estimated, say so.
- Suggest at most 3 concrete next steps.
- Plain text, short paragraphs, no markdown tables.`;

async function callAI(system: string, prompt: string, maxTokens = 700): Promise<string> {
  try {
    const model = await defaultModel();
    const { text } = await generateText({
      model: kimiGw(model),
      system,
      prompt,
      providerOptions: { "kimi-gw": { max_completion_tokens: maxTokens } },
    });
    return text.trim();
  } catch (err) {
    const classified = classifyAiError(err);
    if (classified.name === "AiUnavailable") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI_UNAVAILABLE",
      });
    }
    if (classified.name === "AiTransient") {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI_TRANSIENT" });
    }
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI_ERROR" });
  }
}

export const aiRouter = createRouter({
  nextAction: authedQuery
    .input(z.object({ localTime: z.string().regex(/^\d{2}:\d{2}$/) }))
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const data = await buildUserContext(ctx.user.id, sc.space.id);
      const text = await callAI(
        SYSTEM_COACH,
        `${data}\n\nLocal time now: ${input.localTime}.\nAnswer "What should I do right now?" in 2-4 sentences: one concrete next action (with minutes), then what comes after. Be realistic about the remaining day.`,
        300,
      );
      return { text };
    }),

  rescueDay: authedQuery
    .input(z.object({ localTime: z.string().regex(/^\d{2}:\d{2}$/) }))
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const data = await buildUserContext(ctx.user.id, sc.space.id);
      const text = await callAI(
        SYSTEM_COACH,
        `${data}\n\nLocal time now: ${input.localTime}. The day got away. RESCUE MY DAY: classify each remaining task as KEEP / MOVE / OPTIONAL, and propose a realistic schedule for the rest of today. The user will confirm before anything changes — this is a proposal only.`,
        600,
      );
      return { text };
    }),

  prepareTomorrow: authedQuery
    .input(z.object({ localTime: z.string().regex(/^\d{2}:\d{2}$/) }))
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const data = await buildUserContext(ctx.user.id, sc.space.id);
      const tomorrow = addDays(todayStr(), 1);
      const text = await callAI(
        SYSTEM_COACH,
        `${data}\n\nLocal time now: ${input.localTime}. Tomorrow is ${tomorrow}. PREPARE TOMORROW: review unfinished work, deadlines, habits, study, workout and sleep, then propose a realistic plan for tomorrow (morning / afternoon / evening / night). The user approves before tasks are created.`,
        700,
      );
      return { text };
    }),

  insights: authedQuery.mutation(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    const data = await buildUserContext(ctx.user.id, sc.space.id);
    const text = await callAI(
      SYSTEM_COACH,
      `${data}\n\nGive 3-4 grounded insights about patterns in this data (e.g. postponed tasks, deadline pressure, sleep/study balance). Each must cite the actual numbers. If data is too thin, say what to track for better insights.`,
      500,
    );
    return { text };
  }),

  weeklyReview: authedQuery.mutation(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    const data = await buildUserContext(ctx.user.id, sc.space.id);
    const text = await callAI(
      SYSTEM_COACH,
      `${data}\n\nWEEKLY RESET: summarize this week honestly but kindly (tasks, study, workouts, sleep, habits, goals). Then: what went well, what needs attention, one thing to change next week.`,
      600,
    );
    return { text };
  }),

  mealSuggest: authedQuery.mutation(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    const data = await buildUserContext(ctx.user.id, sc.space.id);
    const text = await callAI(
      SYSTEM_COACH,
      `${data}\n\nSuggest 3 practical meals for today/tomorrow that fit the dietary preferences, allergies, dislikes and favorites above. Keep it simple and realistic. Label any nutrition numbers as estimates.`,
      500,
    );
    return { text };
  }),

  workoutPlan: authedQuery.mutation(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    const data = await buildUserContext(ctx.user.id, sc.space.id);
    const text = await callAI(
      SYSTEM_COACH,
      `${data}\n\nGenerate one practical workout for today based on fitness level, goal, equipment, preferred duration and recent workouts. Prioritize consistency and wellbeing, not weight loss. Safe movements only.`,
      600,
    );
    return { text };
  }),

  /** AI search: answer questions only from accessible application data. */
  ask: authedQuery
    .input(z.object({ question: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const data = await buildUserContext(ctx.user.id, sc.space.id);
      const text = await callAI(
        SYSTEM_COACH,
        `${data}\n\nQuestion: "${input.question}"\nAnswer using ONLY the data above. If the answer is not in the data, say you don't have that information.`,
        400,
      );
      return { text };
    }),

  /** My Coach: persisted chat, only my accessible data. */
  coachChat: authedQuery
    .input(z.object({ message: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const db = getDb();
      const data = await buildUserContext(ctx.user.id, sc.space.id);
      const history = await db
        .select()
        .from(aiMessages)
        .where(eq(aiMessages.userId, ctx.user.id))
        .orderBy(desc(aiMessages.createdAt))
        .limit(10);
      const historyText = history
        .reverse()
        .map((m) => `${m.role === "user" ? "User" : "Coach"}: ${m.content}`)
        .join("\n");
      const text = await callAI(
        SYSTEM_COACH,
        `${data}\n\nRecent conversation:\n${historyText || "(none)"}\n\nUser: ${input.message}\nCoach:`,
        500,
      );
      await db.insert(aiMessages).values([
        { userId: ctx.user.id, role: "user", content: input.message },
        { userId: ctx.user.id, role: "assistant", content: text },
      ]);
      return { text };
    }),

  coachHistory: authedQuery.query(async ({ ctx }) => {
    const rows = await getDb()
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.userId, ctx.user.id))
      .orderBy(asc(aiMessages.createdAt))
      .limit(50);
    return rows;
  }),

  clearCoach: authedQuery.mutation(async ({ ctx }) => {
    await getDb().delete(aiMessages).where(eq(aiMessages.userId, ctx.user.id));
    return { ok: true };
  }),
});
