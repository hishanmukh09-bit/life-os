import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, gte } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { exams, examTopics, studySessions, studySubjects } from "@db/schema";
import { addDays, requireSpace, todayStr } from "./lib/helpers";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const studyRouter = createRouter({
  dashboard: authedQuery.query(async ({ ctx }) => {
    const sc = await requireSpace(ctx.user.id);
    const db = getDb();
    const subjects = await db
      .select()
      .from(studySubjects)
      .where(eq(studySubjects.userId, ctx.user.id));
    const today = todayStr();
    const sessions = await db
      .select()
      .from(studySessions)
      .where(
        and(
          eq(studySessions.userId, ctx.user.id),
          gte(studySessions.date, addDays(today, -29)),
        ),
      )
      .orderBy(asc(studySessions.date));
    const myExams = await db
      .select()
      .from(exams)
      .where(eq(exams.userId, ctx.user.id))
      .orderBy(asc(exams.date));
    const topics = myExams.length
      ? await db
          .select()
          .from(examTopics)
          .where(
            inArrayIds(examTopics.examId, myExams.map((e) => e.id)),
          )
      : [];
    return {
      subjects,
      sessions,
      exams: myExams.map((e) => ({
        ...e,
        topics: topics.filter((t) => t.examId === e.id),
      })),
      spaceId: sc.space.id,
    };
  }),

  addSubject: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(120),
        color: z.string().max(16).nullish(),
        targetMinWeekly: z.number().int().min(0).max(10080).default(300),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const [{ id }] = await getDb()
        .insert(studySubjects)
        .values({ spaceId: sc.space.id, userId: ctx.user.id, ...input })
        .$returningId();
      return { id };
    }),

  deleteSubject: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.studySubjects.findFirst({
        where: eq(studySubjects.id, input.id),
      });
      if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(studySubjects).where(eq(studySubjects.id, input.id));
      return { ok: true };
    }),

  logSession: authedQuery
    .input(
      z.object({
        subjectId: z.number().nullish(),
        durationMin: z.number().int().min(1).max(1440),
        date: dateStr.optional(),
        notes: z.string().max(500).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const [{ id }] = await getDb()
        .insert(studySessions)
        .values({
          spaceId: sc.space.id,
          userId: ctx.user.id,
          subjectId: input.subjectId ?? null,
          durationMin: input.durationMin,
          date: input.date ?? todayStr(),
          notes: input.notes ?? null,
        })
        .$returningId();
      return { id };
    }),

  deleteSession: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.studySessions.findFirst({
        where: eq(studySessions.id, input.id),
      });
      if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(studySessions).where(eq(studySessions.id, input.id));
      return { ok: true };
    }),

  addExam: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(160),
        subject: z.string().max(120).nullish(),
        date: dateStr,
        difficulty: z.number().int().min(1).max(5).default(3),
        notes: z.string().max(500).nullish(),
        topics: z.array(z.string().min(1).max(160)).max(30).default([]),
        visibility: z.enum(["private", "shared"]).default("shared"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const db = getDb();
      const [{ id }] = await db
        .insert(exams)
        .values({
          spaceId: sc.space.id,
          userId: ctx.user.id,
          title: input.title,
          subject: input.subject ?? null,
          date: input.date,
          difficulty: input.difficulty,
          notes: input.notes ?? null,
          visibility: input.visibility,
        })
        .$returningId();
      if (input.topics.length) {
        await db.insert(examTopics).values(
          input.topics.map((name) => ({ examId: id, name, progress: 0 })),
        );
      }
      return { id };
    }),

  setTopicProgress: authedQuery
    .input(z.object({ topicId: z.number(), progress: z.number().int().min(0).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const topic = await db.query.examTopics.findFirst({
        where: eq(examTopics.id, input.topicId),
      });
      if (!topic) throw new TRPCError({ code: "NOT_FOUND" });
      const exam = await db.query.exams.findFirst({
        where: eq(exams.id, topic.examId),
      });
      if (!exam || exam.userId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });
      await db
        .update(examTopics)
        .set({ progress: input.progress })
        .where(eq(examTopics.id, input.topicId));
      return { ok: true };
    }),

  deleteExam: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.exams.findFirst({ where: eq(exams.id, input.id) });
      if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(examTopics).where(eq(examTopics.examId, input.id));
      await db.delete(exams).where(eq(exams.id, input.id));
      return { ok: true };
    }),
});

// Helper: inArray without importing when list empty
import { inArray } from "drizzle-orm";
function inArrayIds(col: typeof examTopics.examId, ids: number[]) {
  return inArray(col, ids.length ? ids : [-1]);
}
