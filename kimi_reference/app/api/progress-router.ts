import { z } from "zod";
import { and, asc, eq, gte } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  habitLogs,
  habits,
  sleepLogs,
  studySessions,
  tasks,
  waterLogs,
  workouts,
} from "@db/schema";
import { addDays, requireSpace, todayStr } from "./lib/helpers";

/** Aggregated, privacy-safe analytics for the current user (and shared partner stats). */
export const progressRouter = createRouter({
  overview: authedQuery
    .input(z.object({ days: z.number().int().min(7).max(365).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      const sc = await requireSpace(ctx.user.id);
      const days = input?.days ?? 30;
      const db = getDb();
      const today = todayStr();
      const since = addDays(today, -(days - 1));
      const uid = ctx.user.id;

      const taskRows = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.spaceId, sc.space.id),
            eq(tasks.assigneeId, uid),
            gte(tasks.dueDate, since),
          ),
        );
      const sessions = await db
        .select()
        .from(studySessions)
        .where(and(eq(studySessions.userId, uid), gte(studySessions.date, since)))
        .orderBy(asc(studySessions.date));
      const workoutRows = await db
        .select()
        .from(workouts)
        .where(and(eq(workouts.userId, uid), gte(workouts.date, since)))
        .orderBy(asc(workouts.date));
      const sleepRows = await db
        .select()
        .from(sleepLogs)
        .where(and(eq(sleepLogs.userId, uid), gte(sleepLogs.date, since)))
        .orderBy(asc(sleepLogs.date));
      const waterRows = await db
        .select()
        .from(waterLogs)
        .where(and(eq(waterLogs.userId, uid), gte(waterLogs.date, since)));
      const myHabits = await db
        .select()
        .from(habits)
        .where(and(eq(habits.userId, uid), eq(habits.archived, false)));
      const hLogs = myHabits.length
        ? await db
            .select()
            .from(habitLogs)
            .where(
              and(
                eq(habitLogs.userId, uid),
                gte(habitLogs.date, since),
              ),
            )
        : [];

      const dates = Array.from({ length: days }, (_, i) => addDays(since, i));
      const perDay = dates.map((d) => {
        const dayTasks = taskRows.filter((t) => t.dueDate === d);
        return {
          date: d,
          tasksTotal: dayTasks.length,
          tasksDone: dayTasks.filter((t) => t.status === "done").length,
          studyMin: sessions
            .filter((s) => s.date === d)
            .reduce((s2, r) => s2 + r.durationMin, 0),
          workoutMin: workoutRows
            .filter((w) => w.date === d)
            .reduce((s2, r) => s2 + r.durationMin, 0),
          sleepMin: sleepRows.find((s) => s.date === d)?.durationMin ?? null,
          waterMl: waterRows
            .filter((w) => w.date === d)
            .reduce((s2, r) => s2 + r.amountMl, 0),
          habitsDone: hLogs.filter((l) => l.date === d).length,
        };
      });

      const done = taskRows.filter((t) => t.status === "done").length;
      const totalStudy = sessions.reduce((s, r) => s + r.durationMin, 0);
      const totalWorkouts = workoutRows.length;
      const totalWorkoutMin = workoutRows.reduce((s, r) => s + r.durationMin, 0);
      const avgSleep =
        sleepRows.length > 0
          ? Math.round(
              sleepRows.reduce((s, r) => s + (r.durationMin ?? 0), 0) / sleepRows.length,
            )
          : null;
      const habitConsistency =
        myHabits.length > 0
          ? Math.round((hLogs.length / (myHabits.length * days)) * 100)
          : null;

      // "Becoming better": compare first half of window vs second half
      const half = Math.floor(days / 2);
      const first = perDay.slice(0, half);
      const second = perDay.slice(half);
      const trend = (a: number, b: number) =>
        a === 0 ? (b > 0 ? 100 : 0) : Math.round(((b - a) / a) * 100);
      const avg = (arr: number[]) =>
        arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : 0;
      const growth = {
        study: trend(avg(first.map((d) => d.studyMin)), avg(second.map((d) => d.studyMin))),
        workouts: trend(
          first.filter((d) => d.workoutMin > 0).length,
          second.filter((d) => d.workoutMin > 0).length,
        ),
        tasks: trend(
          avg(first.map((d) => d.tasksDone)),
          avg(second.map((d) => d.tasksDone)),
        ),
        sleep: trend(
          avg(first.map((d) => d.sleepMin ?? 0)),
          avg(second.map((d) => d.sleepMin ?? 0)),
        ),
      };

      return {
        perDay,
        totals: {
          tasksDone: done,
          tasksTotal: taskRows.length,
          taskRate: taskRows.length ? Math.round((done / taskRows.length) * 100) : null,
          studyMin: totalStudy,
          workouts: totalWorkouts,
          workoutMin: totalWorkoutMin,
          avgSleepMin: avgSleep,
          habitConsistency,
          activeHabits: myHabits.length,
        },
        growth,
      };
    }),
});
