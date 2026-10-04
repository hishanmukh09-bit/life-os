import {
  mysqlTable,
  mysqlEnum,
  serial,
  bigint,
  varchar,
  text,
  int,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ---------------------------------------------------------------------------
// Auth users (managed by the platform auth feature)
// ---------------------------------------------------------------------------
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;

// ---------------------------------------------------------------------------
// Two-person private space
// ---------------------------------------------------------------------------
export const spaces = mysqlTable("spaces", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull().default("Our Space"),
  inviteCode: varchar("inviteCode", { length: 16 }).notNull().unique(),
  ownerId: bigint("ownerId", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const spaceMembers = mysqlTable(
  "space_members",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    role: mysqlEnum("role", ["owner", "partner"]).notNull().default("partner"),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  },
  (t) => ({
    spaceUser: uniqueIndex("space_user_unique").on(t.spaceId, t.userId),
    userIdx: index("member_user_idx").on(t.userId),
  }),
);

// ---------------------------------------------------------------------------
// Profile & preferences (sensitive fields optional)
// ---------------------------------------------------------------------------
export const profiles = mysqlTable("profiles", {
  userId: bigint("userId", { mode: "number", unsigned: true }).primaryKey(),
  displayName: varchar("displayName", { length: 120 }),
  avatarKey: varchar("avatarKey", { length: 255 }),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }),
  gender: varchar("gender", { length: 32 }),
  heightCm: int("heightCm"),
  weightKg: int("weightKg"),
  fitnessGoal: varchar("fitnessGoal", { length: 255 }),
  activityLevel: varchar("activityLevel", { length: 64 }),
  equipment: varchar("equipment", { length: 255 }),
  workoutPrefMin: int("workoutPrefMin"),
  sleepTargetMin: int("sleepTargetMin").default(480),
  wakeTarget: varchar("wakeTarget", { length: 5 }).default("07:00"),
  waterTargetMl: int("waterTargetMl").default(2500),
  studyTargetMin: int("studyTargetMin").default(120),
  diet: varchar("diet", { length: 64 }),
  allergies: text("allergies"),
  dislikedFoods: text("dislikedFoods"),
  favoriteFoods: text("favoriteFoods"),
  occupation: varchar("occupation", { length: 120 }),
  subjects: text("subjects"),
  planningStyle: varchar("planningStyle", { length: 64 }),
  accent: varchar("accent", { length: 32 }).default("terracotta"),
  theme: mysqlEnum("themePref", ["light", "dark", "system"]).default("system"),
  quietHoursStart: varchar("quietHoursStart", { length: 5 }).default("22:00"),
  quietHoursEnd: varchar("quietHoursEnd", { length: 5 }).default("07:00"),
  customMessages: text("customMessages"),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export const taskCategory = [
  "study",
  "college",
  "work",
  "fitness",
  "health",
  "food",
  "personal",
  "household",
  "relationship",
  "life_admin",
  "other",
] as const;
export const taskPriority = ["low", "normal", "high", "must_do"] as const;
export const recurrence = [
  "none",
  "daily",
  "weekdays",
  "weekends",
  "weekly",
  "monthly",
] as const;
export const visibility = ["private", "shared"] as const;

export const tasks = mysqlTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    creatorId: bigint("creatorId", { mode: "number", unsigned: true }).notNull(),
    assigneeId: bigint("assigneeId", { mode: "number", unsigned: true }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: mysqlEnum("category", taskCategory).notNull().default("personal"),
    priority: mysqlEnum("priority", taskPriority).notNull().default("normal"),
    visibility: mysqlEnum("visibility", visibility).notNull().default("shared"),
    status: mysqlEnum("status", ["todo", "done", "archived"])
      .notNull()
      .default("todo"),
    dueDate: varchar("dueDate", { length: 10 }), // YYYY-MM-DD
    dueTime: varchar("dueTime", { length: 5 }), // HH:mm
    recurrence: mysqlEnum("recurrence", recurrence).notNull().default("none"),
    estimatedMin: int("estimatedMin"),
    completedAt: timestamp("completedAt"),
    proofRequired: boolean("proofRequired").notNull().default(false),
    proofKey: varchar("proofKey", { length: 255 }),
    notes: text("notes"),
    postponeCount: int("postponeCount").notNull().default(0),
    seriesId: varchar("seriesId", { length: 32 }), // groups recurring instances
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    spaceIdx: index("task_space_idx").on(t.spaceId, t.assigneeId, t.dueDate),
  }),
);

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------
export const habits = mysqlTable(
  "habits",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    icon: varchar("icon", { length: 32 }),
    color: varchar("color", { length: 16 }),
    visibility: mysqlEnum("visibility", visibility).notNull().default("shared"),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ userIdx: index("habit_user_idx").on(t.userId) }),
);

export const habitLogs = mysqlTable(
  "habit_logs",
  {
    id: serial("id").primaryKey(),
    habitId: bigint("habitId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    date: varchar("date", { length: 10 }).notNull(),
    note: varchar("note", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    habitDate: uniqueIndex("habit_date_unique").on(t.habitId, t.date),
  }),
);

// ---------------------------------------------------------------------------
// Daily trackers
// ---------------------------------------------------------------------------
export const waterLogs = mysqlTable(
  "water_logs",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    date: varchar("date", { length: 10 }).notNull(),
    amountMl: int("amountMl").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ idx: index("water_idx").on(t.userId, t.date) }),
);

export const sleepLogs = mysqlTable(
  "sleep_logs",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    date: varchar("date", { length: 10 }).notNull(), // wake date
    bedtime: varchar("bedtime", { length: 5 }),
    wakeTime: varchar("wakeTime", { length: 5 }),
    durationMin: int("durationMin"),
    quality: int("quality"), // 1-5
    notes: varchar("notes", { length: 255 }),
    visibility: mysqlEnum("visibility", visibility).notNull().default("shared"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    idx: index("sleep_idx").on(t.userId, t.date),
    uniq: uniqueIndex("sleep_user_date").on(t.userId, t.date),
  }),
);

export const meals = mysqlTable(
  "meals",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    date: varchar("date", { length: 10 }).notNull(),
    type: mysqlEnum("type", ["breakfast", "lunch", "snack", "dinner", "other"])
      .notNull()
      .default("other"),
    description: varchar("description", { length: 500 }).notNull(),
    portion: varchar("portion", { length: 120 }),
    time: varchar("time", { length: 5 }),
    photoKey: varchar("photoKey", { length: 255 }),
    notes: varchar("notes", { length: 500 }),
    visibility: mysqlEnum("visibility", visibility).notNull().default("shared"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ idx: index("meal_idx").on(t.userId, t.date) }),
);

export const workouts = mysqlTable(
  "workouts",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    date: varchar("date", { length: 10 }).notNull(),
    type: mysqlEnum("type", [
      "strength",
      "cardio",
      "walking",
      "running",
      "cycling",
      "mobility",
      "yoga",
      "bodyweight",
      "gym",
      "sports",
    ])
      .notNull()
      .default("strength"),
    durationMin: int("durationMin").notNull(),
    exercises: text("exercises"), // JSON: [{name,sets,reps,weight}]
    notes: varchar("notes", { length: 500 }),
    photoKey: varchar("photoKey", { length: 255 }),
    visibility: mysqlEnum("visibility", visibility).notNull().default("shared"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ idx: index("workout_idx").on(t.userId, t.date) }),
);

export const dailyCheckins = mysqlTable(
  "daily_checkins",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    date: varchar("date", { length: 10 }).notNull(),
    mood: mysqlEnum("mood", ["great", "good", "okay", "low", "tired"]).notNull(),
    energy: int("energy").notNull(), // 1-10
    stress: int("stress").notNull(), // 1-10
    mainGoal: varchar("mainGoal", { length: 255 }),
    note: text("note"),
    need: varchar("need", { length: 255 }),
    visibility: mysqlEnum("visibility", visibility).notNull().default("shared"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ uniq: uniqueIndex("checkin_user_date").on(t.userId, t.date) }),
);

export const cycleLogs = mysqlTable(
  "cycle_logs",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    startDate: varchar("startDate", { length: 10 }).notNull(),
    cycleLength: int("cycleLength").default(28),
    periodDuration: int("periodDuration").default(5),
    symptoms: varchar("symptoms", { length: 500 }),
    mood: varchar("mood", { length: 64 }),
    energy: int("energy"),
    notes: text("notes"),
    shared: boolean("shared").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ idx: index("cycle_idx").on(t.userId) }),
);

// ---------------------------------------------------------------------------
// Study
// ---------------------------------------------------------------------------
export const studySubjects = mysqlTable(
  "study_subjects",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    color: varchar("color", { length: 16 }),
    targetMinWeekly: int("targetMinWeekly").default(300),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ idx: index("subject_idx").on(t.userId) }),
);

export const studySessions = mysqlTable(
  "study_sessions",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    subjectId: bigint("subjectId", { mode: "number", unsigned: true }),
    date: varchar("date", { length: 10 }).notNull(),
    durationMin: int("durationMin").notNull(),
    notes: varchar("notes", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ idx: index("session_idx").on(t.userId, t.date) }),
);

export const exams = mysqlTable(
  "exams",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    subject: varchar("subject", { length: 120 }),
    date: varchar("date", { length: 10 }).notNull(),
    difficulty: int("difficulty").default(3), // 1-5
    notes: varchar("notes", { length: 500 }),
    visibility: mysqlEnum("visibility", visibility).notNull().default("shared"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ idx: index("exam_idx").on(t.userId, t.date) }),
);

export const examTopics = mysqlTable(
  "exam_topics",
  {
    id: serial("id").primaryKey(),
    examId: bigint("examId", { mode: "number", unsigned: true }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    progress: int("progress").notNull().default(0), // 0-100
  },
  (t) => ({ idx: index("topic_exam_idx").on(t.examId) }),
);

// ---------------------------------------------------------------------------
// Goals (personal + shared "us" goals)
// ---------------------------------------------------------------------------
export const goals = mysqlTable(
  "goals",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    creatorId: bigint("creatorId", { mode: "number", unsigned: true }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    category: mysqlEnum("category", [
      "academics",
      "career",
      "fitness",
      "projects",
      "reading",
      "skills",
      "financial",
      "personal",
      "us",
    ])
      .notNull()
      .default("personal"),
    description: text("description"),
    targetDate: varchar("targetDate", { length: 10 }),
    progress: int("progress").notNull().default(0), // 0-100
    status: mysqlEnum("status", ["active", "done", "paused"])
      .notNull()
      .default("active"),
    visibility: mysqlEnum("visibility", visibility).notNull().default("private"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => ({ idx: index("goal_idx").on(t.spaceId) }),
);

export const goalMilestones = mysqlTable(
  "goal_milestones",
  {
    id: serial("id").primaryKey(),
    goalId: bigint("goalId", { mode: "number", unsigned: true }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    done: boolean("done").notNull().default(false),
    doneAt: timestamp("doneAt"),
  },
  (t) => ({ idx: index("milestone_goal_idx").on(t.goalId) }),
);

// ---------------------------------------------------------------------------
// Journal & memories
// ---------------------------------------------------------------------------
export const journalEntries = mysqlTable(
  "journal_entries",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    date: varchar("date", { length: 10 }).notNull(),
    title: varchar("title", { length: 200 }),
    content: text("content").notNull(),
    mood: mysqlEnum("mood", ["great", "good", "okay", "low", "tired"]),
    highlights: varchar("highlights", { length: 500 }),
    lessons: varchar("lessons", { length: 500 }),
    gratitude: varchar("gratitude", { length: 500 }),
    photoKey: varchar("photoKey", { length: 255 }),
    visibility: mysqlEnum("visibility", visibility).notNull().default("private"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => ({ idx: index("journal_idx").on(t.userId, t.date) }),
);

export const memories = mysqlTable(
  "memories",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    date: varchar("date", { length: 10 }).notNull(),
    photoKey: varchar("photoKey", { length: 255 }),
    type: mysqlEnum("type", [
      "photo",
      "achievement",
      "goal",
      "trip",
      "special_day",
      "activity",
      "event",
    ])
      .notNull()
      .default("special_day"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ idx: index("memory_idx").on(t.spaceId, t.date) }),
);

// ---------------------------------------------------------------------------
// Us: encouragements, help requests, notifications, shopping
// ---------------------------------------------------------------------------
export const encouragements = mysqlTable(
  "encouragements",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    fromUserId: bigint("fromUserId", { mode: "number", unsigned: true }).notNull(),
    toUserId: bigint("toUserId", { mode: "number", unsigned: true }).notNull(),
    kind: mysqlEnum("kind", ["encouragement", "help_request"])
      .notNull()
      .default("encouragement"),
    category: varchar("category", { length: 64 }),
    message: varchar("message", { length: 500 }).notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ idx: index("enc_idx").on(t.toUserId, t.read) }),
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    type: varchar("type", { length: 40 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: varchar("body", { length: 500 }),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ idx: index("notif_idx").on(t.userId, t.read) }),
);

export const shoppingItems = mysqlTable(
  "shopping_items",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    addedBy: bigint("addedBy", { mode: "number", unsigned: true }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    done: boolean("done").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ idx: index("shop_idx").on(t.spaceId) }),
);

// ---------------------------------------------------------------------------
// Life admin, knowledge vault, saved info, events, little things
// ---------------------------------------------------------------------------
export const lifeAdminItems = mysqlTable(
  "life_admin_items",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    category: mysqlEnum("category", [
      "bills",
      "payments",
      "documents",
      "renewals",
      "appointments",
      "repairs",
      "purchases",
      "other",
    ])
      .notNull()
      .default("other"),
    dueDate: varchar("dueDate", { length: 10 }),
    done: boolean("done").notNull().default(false),
    notes: varchar("notes", { length: 500 }),
    visibility: mysqlEnum("visibility", visibility).notNull().default("shared"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ idx: index("admin_idx").on(t.spaceId, t.dueDate) }),
);

export const knowledgeItems = mysqlTable(
  "knowledge_items",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    content: text("content"),
    url: varchar("url", { length: 500 }),
    type: mysqlEnum("type", [
      "learned",
      "link",
      "idea",
      "project_idea",
      "book",
      "research",
      "note",
      "little_thing",
      "remember",
    ])
      .notNull()
      .default("note"),
    aboutPartner: boolean("aboutPartner").notNull().default(false),
    visibility: mysqlEnum("visibility", visibility).notNull().default("private"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ idx: index("knowledge_idx").on(t.userId) }),
);

export const events = mysqlTable(
  "events",
  {
    id: serial("id").primaryKey(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    type: mysqlEnum("type", [
      "birthday",
      "anniversary",
      "exam",
      "trip",
      "appointment",
      "deadline",
      "milestone",
      "other",
    ])
      .notNull()
      .default("other"),
    date: varchar("date", { length: 10 }).notNull(),
    notes: varchar("notes", { length: 500 }),
    visibility: mysqlEnum("visibility", visibility).notNull().default("shared"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ idx: index("event_idx").on(t.spaceId, t.date) }),
);

// ---------------------------------------------------------------------------
// Files (object storage keys), AI chat history
// ---------------------------------------------------------------------------
export const files = mysqlTable(
  "files",
  {
    id: serial("id").primaryKey(),
    key: varchar("key", { length: 255 }).notNull().unique(),
    ownerId: bigint("ownerId", { mode: "number", unsigned: true }).notNull(),
    spaceId: bigint("spaceId", { mode: "number", unsigned: true }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    size: int("size").notNull().default(0),
    purpose: varchar("purpose", { length: 40 }).notNull().default("general"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ idx: index("file_owner_idx").on(t.ownerId) }),
);

export const aiMessages = mysqlTable(
  "ai_messages",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    role: mysqlEnum("role", ["user", "assistant"]).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ idx: index("aimsg_idx").on(t.userId) }),
);

// Inferred types
export type Space = typeof spaces.$inferSelect;
export type SpaceMember = typeof spaceMembers.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Habit = typeof habits.$inferSelect;
export type HabitLog = typeof habitLogs.$inferSelect;
export type WaterLog = typeof waterLogs.$inferSelect;
export type SleepLog = typeof sleepLogs.$inferSelect;
export type Meal = typeof meals.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type CycleLog = typeof cycleLogs.$inferSelect;
export type StudySubject = typeof studySubjects.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type ExamTopic = typeof examTopics.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type GoalMilestone = typeof goalMilestones.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type Memory = typeof memories.$inferSelect;
export type Encouragement = typeof encouragements.$inferSelect;
export type AppNotification = typeof notifications.$inferSelect;
export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type LifeAdminItem = typeof lifeAdminItems.$inferSelect;
export type KnowledgeItem = typeof knowledgeItems.$inferSelect;
export type AppEvent = typeof events.$inferSelect;
export type FileRow = typeof files.$inferSelect;

export type InsertUser = typeof users.$inferInsert;
