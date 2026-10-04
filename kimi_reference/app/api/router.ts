import { authRouter } from "./auth-router";
import { spaceRouter } from "./space-router";
import { profileRouter } from "./profile-router";
import { taskRouter } from "./task-router";
import { habitRouter } from "./habit-router";
import { trackerRouter } from "./tracker-router";
import { studyRouter } from "./study-router";
import { goalRouter } from "./goal-router";
import { journalRouter, memoryRouter } from "./journal-router";
import { socialRouter } from "./social-router";
import { miscRouter } from "./misc-router";
import { progressRouter } from "./progress-router";
import { aiRouter } from "./ai-router";
import { storageRouter } from "./storage-router";
import { searchRouter } from "./search-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  space: spaceRouter,
  profile: profileRouter,
  task: taskRouter,
  habit: habitRouter,
  tracker: trackerRouter,
  study: studyRouter,
  goal: goalRouter,
  journal: journalRouter,
  memory: memoryRouter,
  social: socialRouter,
  misc: miscRouter,
  progress: progressRouter,
  ai: aiRouter,
  storage: storageRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;
