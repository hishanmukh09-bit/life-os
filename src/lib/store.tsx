'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import {
  Space,
  UserProfile,
  TaskItem,
  Habit,
  DailyCheckin,
  WaterLog,
  SleepLog,
  MealItem,
  WorkoutLog,
  CycleLog,
  StudySubject,
  Exam,
  StudySession,
  Goal,
  Encouragement,
  HelpRequest,
  JournalEntry,
  MemoryItem,
  LittleThing,
  EventItem,
  ShoppingItem,
  LifeAdminItem,
  KnowledgeItem,
  Achievement,
  ProjectItem,
  ClassScheduleItem,
  SharedExpense,
  TripItem,
  SubscriptionItem,
  DocumentItem,
  SkillItem,
  ReadingBook,
  PersonalChallenge,
  SpecialMode,
  DailyPartnerNote,
  MealSlot,
  DailyMealCheck
} from '@/types';
import {
  DEMO_SPACE,
  DEMO_PROFILES,
  INITIAL_TASKS,
  INITIAL_HABITS,
  INITIAL_CHECKINS,
  INITIAL_STUDY_SUBJECTS,
  INITIAL_EXAMS,
  INITIAL_GOALS,
  INITIAL_MEMORIES,
  INITIAL_LITTLE_THINGS,
  INITIAL_SHOPPING,
  INITIAL_LIFE_ADMIN,
  INITIAL_KNOWLEDGE,
  INITIAL_ENCOURAGEMENTS,
  INITIAL_EVENTS,
  INITIAL_ACHIEVEMENTS,
  INITIAL_PROJECTS,
  INITIAL_CLASS_SCHEDULE,
  INITIAL_SHARED_EXPENSES,
  INITIAL_TRIPS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_DOCUMENTS,
  INITIAL_SKILLS,
  INITIAL_READING,
  INITIAL_CHALLENGES
} from './mock-data';
import { generateId } from './utils';
import { AIService } from './ai-service';
import { reminderEngine } from './reminder-engine';
import { WEBSTORAGE_KEYS, getWebStorage, setWebStorage } from './webstorage';
import { hashString, pullItems, pushItems, subscribeToChanges, SyncItem } from './cloud-sync';

const SYNC_STATE_KEY = 'lifeos_sync_state_v1';

// Who may see an item. Private tasks and personal study/cycle data never reach the partner's devices.
function isVisibleTo(collection: string, item: any, userId: string): boolean {
  if (!item) return false;
  if (collection === 'tasks' || collection === 'trashTasks') {
    return item.visibility !== 'PRIVATE' || item.creatorId === userId || item.assignedToId === userId;
  }
  if (collection === 'studySubjects' || collection === 'exams' || collection === 'studySessions' || collection === 'cycleLogs') {
    return !item.userId || item.userId === userId;
  }
  if (collection === 'prefs') return String(item.id).startsWith(`${userId}:`);
  return true;
}
import { soundFx } from './sound-fx';

export interface LightboxData {
  url: string;
  title?: string;
  timestamp?: string;
  taskId?: string;
  aiVerification?: {
    verified: boolean;
    confidence: number;
    detectedObjects: string[];
    summary: string;
    verifiedAt: string;
    verificationHash?: string;
  };
}

interface LifeOSContextType {
  currentUser: UserProfile;
  currentSpace: Space;
  partnerUser: UserProfile | null;
  tasks: TaskItem[];
  trashTasks: TaskItem[];
  habits: Habit[];
  checkins: DailyCheckin[];
  studySubjects: StudySubject[];
  exams: Exam[];
  studySessions: StudySession[];
  goals: Goal[];
  memories: MemoryItem[];
  littleThings: LittleThing[];
  shoppingItems: ShoppingItem[];
  lifeAdminItems: LifeAdminItem[];
  knowledgeItems: KnowledgeItem[];
  encouragements: Encouragement[];
  events: EventItem[];
  achievements: Achievement[];
  waterIntake: number;
  sleepLogs: SleepLog[];
  meals: MealItem[];
  workouts: WorkoutLog[];
  cycleLogs: CycleLog[];
  // Upgrade entities
  projects: ProjectItem[];
  classSchedule: ClassScheduleItem[];
  sharedExpenses: SharedExpense[];
  trips: TripItem[];
  subscriptions: SubscriptionItem[];
  documents: DocumentItem[];
  skills: SkillItem[];
  readingBooks: ReadingBook[];
  challenges: PersonalChallenge[];
  // Special Modes & Core Daily Lifecycle
  specialMode: SpecialMode;
  setSpecialMode: (mode: SpecialMode) => void;
  todaysTopThree: string[];
  setTodaysTopThree: (ids: string[]) => void;
  oneThingId: string | null;
  setOneThingId: (id: string | null) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  // Lightbox
  lightbox: LightboxData | null;
  openLightbox: (data: LightboxData) => void;
  closeLightbox: () => void;
  // Actions
  switchUser: (userId: string) => void;
  setAccentColor: (color: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  joinSpace: (inviteCode: string) => { success: boolean; message: string };
  createSpace: (spaceName: string) => void;
  // Task Actions
  addTask: (task: Omit<TaskItem, 'id' | 'spaceId' | 'creatorId' | 'createdAt' | 'updatedAt'>) => void;
  toggleTask: (taskId: string, proofImg?: string) => { success: boolean; error?: string };
  snoozeTask: (taskId: string, minutes: number) => void;
  rescheduleTask: (taskId: string, newDate: string, newTime?: string) => void;
  deleteTask: (taskId: string) => void;
  restoreTask: (taskId: string) => void;
  deleteTaskProof: (taskId: string) => void;
  replaceTaskProof: (taskId: string, newUrl: string) => void;
  toggleTaskSubtask: (taskId: string, subtaskId: string) => void;
  // Clean Mode & Real Life Toggle
  isCleanMode: boolean;
  setIsCleanMode: (clean: boolean) => void;
  loadDemoData: () => void;
  resetToCleanSlate: () => void;
  // Active Reminder Notifications
  activeReminderAlert: any;
  dismissReminderAlert: () => void;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  // Habit Actions
  toggleHabit: (habitId: string) => void;
  addHabit: (title: string, category: string, frequency: Habit['frequency']) => void;
  // Wellness Actions
  addWater: (amountMl: number) => void;
  logSleep: (bedtime: string, wakeTime: string, durationMinutes: number, quality: number, notes?: string) => void;
  addMeal: (meal: Omit<MealItem, 'id' | 'spaceId' | 'userId' | 'date'>) => void;
  addWorkout: (workout: Omit<WorkoutLog, 'id' | 'spaceId' | 'userId' | 'date'>) => void;
  logDailyCheckin: (checkin: Omit<DailyCheckin, 'id' | 'spaceId' | 'userId' | 'date' | 'createdAt'>) => void;
  logCycle: (log: Omit<CycleLog, 'id' | 'userId'>) => void;
  // Study Actions
  addStudySubject: (name: string, code: string, color: string, targetHours: number) => void;
  updateTopicMastery: (subjectId: string, topicId: string, delta: number) => void;
  logStudySession: (durationMins: number, focusMode: StudySession['focusMode'], subjectName?: string, learned?: string, photo?: string) => void;
  addExam: (exam: Omit<Exam, 'id' | 'spaceId' | 'userId'>) => void;
  addClassScheduleItem: (item: Omit<ClassScheduleItem, 'id'>) => void;
  // Projects Actions
  addProject: (title: string, description: string, deadline: string, isShared: boolean) => void;
  toggleProjectMilestone: (projectId: string, milestoneId: string) => void;
  addMilestoneToProject: (projectId: string, title: string, tasks: string[]) => void;
  // Shared Expenses & Travel
  addSharedExpense: (title: string, amount: number, category: SharedExpense['category'], splitPct?: number) => void;
  toggleSettleExpense: (id: string) => void;
  togglePackingItem: (tripId: string, itemId: string) => void;
  addTrip: (trip: Omit<TripItem, 'id' | 'spaceId'>) => void;
  // Documents & Subscriptions
  addSubscription: (sub: Omit<SubscriptionItem, 'id' | 'userId'>) => void;
  addDocument: (doc: Omit<DocumentItem, 'id' | 'userId'>) => void;
  // Skills, Reading & Challenges
  logSkillPractice: (skillId: string, hours: number) => void;
  updateReadingProgress: (bookId: string, pagesRead: number) => void;
  advanceChallengeDay: (challengeId: string) => void;
  // Goals Actions
  addGoal: (goal: Omit<Goal, 'id' | 'spaceId' | 'creatorId' | 'progress'>) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  // Connection Actions
  sendEncouragement: (message: string, emoji: string) => void;
  requestHelp: (category: HelpRequest['category'], message?: string) => void;
  addMemory: (memory: Omit<MemoryItem, 'id' | 'spaceId' | 'userId'>) => void;
  addLittleThing: (thing: Omit<LittleThing, 'id' | 'spaceId' | 'userId'>) => void;
  // Shared Admin & Shopping
  toggleShoppingItem: (id: string) => void;
  addShoppingItem: (title: string, category: string) => void;
  addLifeAdminItem: (item: Omit<LifeAdminItem, 'id' | 'spaceId' | 'userId' | 'status'>) => void;
  toggleLifeAdminStatus: (id: string) => void;
  addKnowledgeItem: (title: string, category: KnowledgeItem['category'], content: string, tags: string[]) => void;
  // Daily Note for Each Other
  dailyPartnerNotes: DailyPartnerNote[];
  saveDailyNote: (note: string, moodEmoji?: string) => void;
  deleteExam: (id: string) => void;
  cloudSyncStatus: 'connecting' | 'connected' | 'offline';
  triggerSync: () => void;
  // Daily Meal Slots (Morning, Lunch, Snacks, Dinner)
  dailyMealChecks: DailyMealCheck[];
  toggleMealCheck: (slot: MealSlot, dishName?: string, forUserId?: string) => void;
}

const LifeOSContext = createContext<LifeOSContextType | undefined>(undefined);

export function LifeOSProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_PROFILES.user_shanmukh);
  const [currentSpace, setCurrentSpace] = useState<Space>(DEMO_SPACE);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [trashTasks, setTrashTasks] = useState<TaskItem[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [studySubjects, setStudySubjects] = useState<StudySubject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [littleThings, setLittleThings] = useState<LittleThing[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [lifeAdminItems, setLifeAdminItems] = useState<LifeAdminItem[]>([]);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [encouragements, setEncouragements] = useState<Encouragement[]>(INITIAL_ENCOURAGEMENTS);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  
  // New upgrade state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [classSchedule, setClassSchedule] = useState<ClassScheduleItem[]>([]);
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpense[]>([]);
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [readingBooks, setReadingBooks] = useState<ReadingBook[]>([]);
  const [challenges, setChallenges] = useState<PersonalChallenge[]>([]);
  const [dailyPartnerNotes, setDailyPartnerNotes] = useState<DailyPartnerNote[]>([]);
  const [dailyMealChecks, setDailyMealChecks] = useState<DailyMealCheck[]>([]);

  // Modes & Focus
  const [specialMode, setSpecialMode] = useState<SpecialMode>('NORMAL');
  const [todaysTopThree, setTodaysTopThree] = useState<string[]>([]);
  const [oneThingId, setOneThingId] = useState<string | null>(null);

  // Clean Mode (Real Life vs Demo Data) & Reminders - Default to TRUE for pure fresh life
  const [isCleanMode, setIsCleanMode] = useState<boolean>(true);
  const [activeReminderAlert, setActiveReminderAlert] = useState<any>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');

  // Lightbox
  const [lightbox, setLightbox] = useState<LightboxData | null>(null);

  const [waterIntake, setWaterIntake] = useState<number>(0);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [cycleLogs, setCycleLogs] = useState<CycleLog[]>([]);

  const [activeView, setActiveView] = useState<string>('HOME');

  // Partner detection
  const partnerMember = currentSpace.members.find(m => m.userId !== currentUser.id);
  const partnerUser = partnerMember ? (DEMO_PROFILES[partnerMember.userId] || {
    id: partnerMember.userId,
    name: partnerMember.name,
    email: partnerMember.email,
    accentColor: partnerMember.accentColor || 'rose',
    theme: 'dark',
    sleepTargetHours: 8,
    wakeTargetTime: '07:30',
    waterTargetMl: 2500
  }) : null;

  // Everything listed here is stored on the server and synced live to every device.
  // [current value, setter, localStorage key for offline cache]
  const K = WEBSTORAGE_KEYS;
  const synced: Record<string, [any[], (v: any) => void, string]> = {
    tasks: [tasks, setTasks, K.TASKS],
    trashTasks: [trashTasks, setTrashTasks, K.TRASH_TASKS],
    habits: [habits, setHabits, K.HABITS],
    checkins: [checkins, setCheckins, K.CHECKINS],
    studySubjects: [studySubjects, setStudySubjects, K.STUDY_SUBJECTS],
    exams: [exams, setExams, K.EXAMS],
    studySessions: [studySessions, setStudySessions, K.STUDY_SESSIONS],
    goals: [goals, setGoals, K.GOALS],
    memories: [memories, setMemories, K.MEMORIES],
    littleThings: [littleThings, setLittleThings, K.LITTLE_THINGS],
    shoppingItems: [shoppingItems, setShoppingItems, K.SHOPPING],
    lifeAdminItems: [lifeAdminItems, setLifeAdminItems, K.LIFE_ADMIN],
    knowledgeItems: [knowledgeItems, setKnowledgeItems, K.KNOWLEDGE],
    encouragements: [encouragements, setEncouragements, K.ENCOURAGEMENTS],
    events: [events, setEvents, K.EVENTS],
    achievements: [achievements, setAchievements, K.ACHIEVEMENTS],
    projects: [projects, setProjects, K.PROJECTS],
    classSchedule: [classSchedule, setClassSchedule, K.CLASS_SCHEDULE],
    sharedExpenses: [sharedExpenses, setSharedExpenses, K.SHARED_EXPENSES],
    trips: [trips, setTrips, K.TRIPS],
    subscriptions: [subscriptions, setSubscriptions, K.SUBSCRIPTIONS],
    documents: [documents, setDocuments, K.DOCUMENTS],
    skills: [skills, setSkills, K.SKILLS],
    readingBooks: [readingBooks, setReadingBooks, K.READING],
    challenges: [challenges, setChallenges, K.CHALLENGES],
    dailyPartnerNotes: [dailyPartnerNotes, setDailyPartnerNotes, K.DAILY_PARTNER_NOTES],
    dailyMealChecks: [dailyMealChecks, setDailyMealChecks, K.DAILY_MEAL_CHECKS],
    sleepLogs: [sleepLogs, setSleepLogs, K.SLEEP],
    meals: [meals, setMeals, K.MEALS],
    workouts: [workouts, setWorkouts, K.WORKOUTS],
    cycleLogs: [cycleLogs, setCycleLogs, K.CYCLE],
    // Per-person values, synced across that person's own devices
    prefs: [[
      { id: `${currentUser.id}:water`, value: waterIntake },
      { id: `${currentUser.id}:topThree`, value: todaysTopThree },
      { id: `${currentUser.id}:oneThing`, value: oneThingId }
    ], () => {}, '']
  };
  const syncedRef = React.useRef(synced);
  syncedRef.current = synced;

  // Sync theme & accent attribute on document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-accent', currentUser.accentColor || 'indigo');
      if (currentUser.theme === 'dark') {
        root.classList.add('dark');
      } else if (currentUser.theme === 'light') {
        root.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) root.classList.add('dark');
        else root.classList.remove('dark');
      }
    }
  }, [currentUser.accentColor, currentUser.theme]);

  const openLightbox = (data: LightboxData) => setLightbox(data);
  const closeLightbox = () => setLightbox(null);

  const switchUser = (userId: string) => {
    if (DEMO_PROFILES[userId]) {
      setCurrentUser(DEMO_PROFILES[userId]);
    }
  };

  const setAccentColor = (color: string) => {
    setCurrentUser(prev => ({ ...prev, accentColor: color }));
  };

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    setCurrentUser(prev => ({ ...prev, theme }));
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  const joinSpace = (inviteCode: string) => {
    if (currentSpace.members.length >= 2) {
      return { success: false, message: 'This private space already has exactly two partners. Access prevented by space isolation policy.' };
    }
    if (inviteCode.toUpperCase() === currentSpace.inviteCode) {
      return { success: true, message: 'Welcome to your shared private space!' };
    }
    return { success: false, message: 'Invalid invitation code. Please verify with your partner.' };
  };

  const createSpace = (spaceName: string) => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCurrentSpace({
      id: generateId('space'),
      name: spaceName,
      inviteCode: newCode,
      ownerId: currentUser.id,
      createdAt: new Date().toISOString(),
      members: [
        {
          userId: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: 'OWNER',
          joinedAt: new Date().toISOString(),
          accentColor: currentUser.accentColor
        }
      ]
    });
  };

  // Hydrate all state from permanent browser WebStorage on mount (offline cache)
  const [isWebStorageReady, setIsWebStorageReady] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    for (const [coll, [, set, key]] of Object.entries(syncedRef.current)) {
      if (coll === 'prefs') continue;
      const stored = getWebStorage<any[] | null>(key, null);
      if (Array.isArray(stored)) set(stored);
    }
    setWaterIntake(getWebStorage<number>(WEBSTORAGE_KEYS.WATER, 0));
    setTodaysTopThree(getWebStorage<string[]>(WEBSTORAGE_KEYS.TOP_THREE, []));
    setOneThingId(getWebStorage<string | null>(WEBSTORAGE_KEYS.ONE_THING, null));

    const storedUser = getWebStorage<UserProfile | null>(WEBSTORAGE_KEYS.CURRENT_USER, null);
    if (storedUser) setCurrentUser(storedUser);
    const storedSpace = getWebStorage<Space | null>(WEBSTORAGE_KEYS.CURRENT_SPACE, null);
    if (storedSpace) setCurrentSpace(storedSpace);

    setIsWebStorageReady(true);
  }, []);

  useEffect(() => {
    if (!isWebStorageReady) return;
    setWebStorage(WEBSTORAGE_KEYS.CURRENT_USER, currentUser);
  }, [currentUser, isWebStorageReady]);

  useEffect(() => {
    if (!isWebStorageReady) return;
    setWebStorage(WEBSTORAGE_KEYS.CURRENT_SPACE, currentSpace);
  }, [currentSpace, isWebStorageReady]);

  // ---------------- Multi-device sync engine ----------------
  // Server = source of truth. `snap` holds a hash of every item as last confirmed by
  // the server; anything that differs locally is an unsent change and gets pushed.
  const flushRef = React.useRef<() => void>(() => {});
  const resyncRef = React.useRef<() => void>(() => {});

  useEffect(() => {
    if (!isWebStorageReady) return;
    const spaceId = currentSpace.id;
    const me = currentUser.id;
    const saved = getWebStorage<any>(SYNC_STATE_KEY, null);
    const fresh = !(saved && saved.spaceId === spaceId && saved.userId === me && saved.snap);
    const st = {
      seq: fresh ? 0 : Number(saved.seq) || 0,
      snap: (fresh ? {} : saved.snap) as Record<string, Record<string, string>>,
      ready: false,
      firstRun: fresh // first sync on this device/profile: server copy wins, local-only items are uploaded
    };
    let closed = false, flushing = false, flushAgain = false, pulling = false, pullAgain = false;

    // Switching profile: drop anything this person must not see
    if (fresh) {
      for (const [coll, [, set]] of Object.entries(syncedRef.current)) {
        if (coll !== 'prefs') set((prev: any[]) => prev.filter(it => !it || isVisibleTo(coll, it, me)));
      }
    }

    const save = () => setWebStorage(SYNC_STATE_KEY, { spaceId, userId: me, seq: st.seq, snap: st.snap });
    const itemHash = (it: any) => hashString(JSON.stringify(it));
    const visibleMap = (coll: string, list: any[]) => {
      const m = new Map<string, any>();
      for (const it of list) if (it && it.id != null && isVisibleTo(coll, it, me)) m.set(String(it.id), it);
      return m;
    };

    const flush = async () => {
      if (closed || !st.ready) return;
      if (flushing) { flushAgain = true; return; }
      const items: SyncItem[] = [];
      const confirm: [string, string, string | null][] = [];
      for (const [coll, [list]] of Object.entries(syncedRef.current)) {
        const snap = (st.snap[coll] ||= {});
        const local = visibleMap(coll, list);
        local.forEach((it, id) => {
          const h = itemHash(it);
          if (snap[id] !== h) { items.push({ collection: coll, id, data: it }); confirm.push([coll, id, h]); }
        });
        for (const id of Object.keys(snap)) {
          if (!local.has(id)) { items.push({ collection: coll, id, deleted: true }); confirm.push([coll, id, null]); }
        }
      }
      if (items.length === 0) return;
      flushing = true;
      const ok = await pushItems(spaceId, items);
      flushing = false;
      if (closed) return;
      if (ok) {
        for (const [coll, id, h] of confirm) {
          if (h === null) delete st.snap[coll][id];
          else st.snap[coll][id] = h;
        }
        save();
      }
      // failed pushes stay "unsent" and retry on the next pull (every <=15s, on reconnect/wake)
      if (flushAgain) { flushAgain = false; flush(); }
    };

    const apply = (rows: SyncItem[]) => {
      const ops: Record<string, Map<string, any>> = {};
      const localCache: Record<string, Map<string, any>> = {};
      for (const row of rows) {
        const coll = row.collection;
        const entry = syncedRef.current[coll];
        if (!entry) continue;
        const id = String(row.id);
        const snap = (st.snap[coll] ||= {});
        const op = (ops[coll] ||= new Map());
        if (!row.deleted && !isVisibleTo(coll, row.data, me)) {
          // e.g. partner made a task private: drop our copy without pushing a delete
          if (snap[id] !== undefined) { delete snap[id]; op.set(id, null); }
          continue;
        }
        const local = (localCache[coll] ||= visibleMap(coll, entry[0])).get(id);
        const localHash = local ? itemHash(local) : undefined;
        const rowHash = row.deleted ? undefined : itemHash(row.data);
        const unsent = !st.firstRun && localHash !== snap[id];
        if (unsent && localHash !== rowHash) continue; // our newer local edit wins; flush sends it
        if (row.deleted) {
          delete snap[id];
          if (local) op.set(id, null);
        } else {
          snap[id] = rowHash!;
          if (localHash !== rowHash) op.set(id, row.data);
        }
      }

      for (const [coll, op] of Object.entries(ops)) {
        if (op.size === 0) continue;
        if (coll === 'prefs') {
          const prefs = syncedRef.current.prefs[0];
          op.forEach((v, id) => {
            if (!v) return;
            const i = prefs.findIndex(p => p.id === id);
            if (i >= 0) prefs[i] = v;
            const key = id.slice(me.length + 1);
            if (key === 'water') setWaterIntake(Number(v.value) || 0);
            else if (key === 'topThree') setTodaysTopThree(Array.isArray(v.value) ? v.value : []);
            else if (key === 'oneThing') setOneThingId(v.value ?? null);
          });
          continue;
        }
        const merge = (prev: any[]) => {
          const left = new Map(op);
          const out: any[] = [];
          for (const it of prev) {
            const key = String(it?.id);
            if (left.has(key)) {
              const v = left.get(key);
              left.delete(key);
              if (v) out.push(v);
            } else out.push(it);
          }
          const added = Array.from(left.values()).filter(Boolean).reverse();
          return [...added, ...out];
        };
        // Update the ref now too, so a flush before React re-renders doesn't push stale data back
        syncedRef.current[coll][0] = merge(syncedRef.current[coll][0]);
        syncedRef.current[coll][1](merge);

        // Partner activity chimes
        if (st.firstRun) continue;
        op.forEach((v) => {
          if (!v) return;
          if (coll === 'tasks' && v.status === 'COMPLETED' && v.creatorId !== me) soundFx.playTaskCompleteChime();
          if (coll === 'dailyPartnerNotes' && v.fromUserId !== me) soundFx.playPartnerNoteChime();
          if (coll === 'encouragements' && v.fromUserId !== me) soundFx.playEncouragementChime();
        });
      }
    };

    const pull = async () => {
      if (closed) return;
      if (pulling) { pullAgain = true; return; }
      pulling = true;
      const res = await pullItems(spaceId, st.seq);
      pulling = false;
      if (closed) return;
      if (res) {
        apply(res.items);
        st.seq = res.seq;
        st.ready = true;
        st.firstRun = false;
        save();
        flush();
      }
      if (pullAgain) { pullAgain = false; pull(); }
    };

    flushRef.current = flush;
    resyncRef.current = () => { st.seq = 0; pull(); };
    const unsub = subscribeToChanges(spaceId, pull, setCloudSyncStatus);
    return () => {
      closed = true;
      unsub();
      flushRef.current = () => {};
      resyncRef.current = () => {};
    };
  }, [currentSpace.id, currentUser.id, isWebStorageReady]);

  // Any local change: cache it offline and push it to the server (debounced)
  const syncedValues = Object.values(synced).map(([v]) => v);
  useEffect(() => {
    if (!isWebStorageReady) return;
    for (const [coll, [list, , key]] of Object.entries(syncedRef.current)) {
      if (coll !== 'prefs') setWebStorage(key, list);
    }
    setWebStorage(WEBSTORAGE_KEYS.WATER, waterIntake);
    setWebStorage(WEBSTORAGE_KEYS.TOP_THREE, todaysTopThree);
    setWebStorage(WEBSTORAGE_KEYS.ONE_THING, oneThingId);
    const t = setTimeout(() => flushRef.current(), 200);
    return () => clearTimeout(t);
  }, [...syncedValues.slice(0, -1), waterIntake, todaysTopThree, oneThingId, isWebStorageReady]);

  // Real Persistent Reminder Engine Listener
  useEffect(() => {
    reminderEngine.init();

    const onReminder = (e: any) => {
      if (e.detail) {
        setActiveReminderAlert(e.detail);
      }
    };

    window.addEventListener('lifeos:reminder_alert', onReminder);
    return () => {
      window.removeEventListener('lifeos:reminder_alert', onReminder);
    };
  }, []);

  const dismissReminderAlert = () => setActiveReminderAlert(null);

  const requestNotificationPermission = async () => {
    return await reminderEngine.requestPermission();
  };

  // Immediate Persistent Task Creation with instant WebStorage write
  const addTask = async (taskData: Omit<TaskItem, 'id' | 'spaceId' | 'creatorId' | 'createdAt' | 'updatedAt'>) => {
    const id = generateId('task');
    const now = new Date().toISOString();
    const newTask: TaskItem = {
      ...taskData,
      id,
      spaceId: currentSpace.id,
      creatorId: currentUser.id,
      assignedToId: taskData.assignedToId || currentUser.id,
      createdAt: now,
      updatedAt: now
    };

    // 1. Instant React state and synchronous WebStorage persistence
    setTasks(prev => {
      const updated = [newTask, ...prev];
      setWebStorage(WEBSTORAGE_KEYS.TASKS, updated);
      return updated;
    });


    // 3. Background SQLite database persistence
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
    } catch (e) {
      console.warn('Backend SQLite sync offline, preserved permanently in WebStorage');
    }
  };

  const toggleTask = (taskId: string, proofImg?: string): { success: boolean; error?: string } => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return { success: false, error: 'TASK_NOT_FOUND' };

    const isCompleting = target.status !== 'COMPLETED' || Boolean(proofImg);
    // Strict Part 14: IF proofRequired == true AND no proof exists/provided THEN reject completion with PROOF_REQUIRED
    if (isCompleting && target.proofRequired && !proofImg && !target.proof) {
      console.warn(`[Task Proof Policy] Rejected completion for "${target.title}": PROOF_REQUIRED.`);
      return { success: false, error: 'PROOF_REQUIRED' };
    }

    const nextStatus: TaskItem['status'] = proofImg ? 'COMPLETED' : (target.status === 'COMPLETED' ? 'TODO' : 'COMPLETED');
    const now = new Date().toISOString();
    const aiVerification = proofImg 
      ? AIService.verifyPhotoProof(target.category, target.title, proofImg) 
      : undefined;

    const proofObj = proofImg ? {
      id: generateId('proof'),
      taskId,
      imageUrl: proofImg,
      uploadedBy: currentUser.name.split(' ')[0],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      visibility: target.visibility,
      aiVerification
    } : (nextStatus === 'TODO' ? undefined : target.proof);

    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'COMPLETED' ? now : undefined,
            updatedAt: now,
            proof: proofObj
          };
        }
        return t;
      });
      setWebStorage(WEBSTORAGE_KEYS.TASKS, updated);
      return updated;
    });

    if (nextStatus === 'COMPLETED') {
      soundFx.playTaskCompleteChime();
    }

    const updatedTaskItem = {
      ...target,
      status: nextStatus,
      completedAt: nextStatus === 'COMPLETED' ? now : undefined,
      updatedAt: now,
      proof: proofObj
    };


    // Immediate DB synchronization
    fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SET_STATUS',
        status: nextStatus,
        taskId,
        task: updatedTaskItem,
        userId: currentUser.id,
        userName: currentUser.name,
        proofImg
      })
    }).catch(() => {});

    return { success: true };
  };

  // Snooze task & reschedule reminder
  const snoozeTask = (taskId: string, minutes: number) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    const snoozeTarget = new Date(Date.now() + minutes * 60 * 1000);
    const newTime = snoozeTarget.toTimeString().substring(0, 5);
    const newDate = snoozeTarget.toISOString().split('T')[0];
    const now = new Date().toISOString();

    setTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, dueDate: newDate, dueTime: newTime, updatedAt: now } : t);
      setWebStorage(WEBSTORAGE_KEYS.TASKS, updated);
      return updated;
    });


    fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SNOOZE',
        taskId,
        minutes
      })
    }).catch(() => {});
  };

  // Reschedule task date & time
  const rescheduleTask = (taskId: string, newDate: string, newTime?: string) => {
    const target = tasks.find(t => t.id === taskId);
    const now = new Date().toISOString();
    const finalTime = newTime || target?.dueTime;
    setTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, dueDate: newDate, dueTime: finalTime, updatedAt: now } : t);
      setWebStorage(WEBSTORAGE_KEYS.TASKS, updated);
      return updated;
    });


    fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'RESCHEDULE',
        taskId,
        newDate,
        newTime
      })
    }).catch(() => {});
  };

  // Soft delete task to trash for recovery
  const deleteTask = (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (target) {
      const now = new Date().toISOString();
      const deletedItem = { ...target, deletedAt: now };
      setTrashTasks(prev => {
        const updatedTrash = [deletedItem, ...prev];
        setWebStorage(WEBSTORAGE_KEYS.TRASH_TASKS, updatedTrash);
        return updatedTrash;
      });
      setTasks(prev => {
        const updated = prev.filter(t => t.id !== taskId);
        setWebStorage(WEBSTORAGE_KEYS.TASKS, updated);
        return updated;
      });


      fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' }).catch(() => {});
    }
  };

  const restoreTask = (taskId: string) => {
    const target = trashTasks.find(t => t.id === taskId);
    if (target) {
      const now = new Date().toISOString();
      const restored = { ...target, deletedAt: undefined, updatedAt: now };
      setTrashTasks(prev => {
        const updatedTrash = prev.filter(t => t.id !== taskId);
        setWebStorage(WEBSTORAGE_KEYS.TRASH_TASKS, updatedTrash);
        return updatedTrash;
      });
      setTasks(prev => {
        const updated = [restored, ...prev];
        setWebStorage(WEBSTORAGE_KEYS.TASKS, updated);
        return updated;
      });


      fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE', taskId })
      }).catch(() => {});
    }
  };

  // Clean Mode (Requirements 13 & 14: NO Preloaded Fake Life for new user)
  const resetToCleanSlate = () => {
    setIsCleanMode(true);
    setTasks([]);
    setTrashTasks([]);
    setHabits([]);
    setCheckins([]);
    setStudySubjects([]);
    setExams([]);
    setGoals([]);
    setMemories([]);
    setMeals([]);
    setWorkouts([]);
    setShoppingItems([]);
    setLifeAdminItems([]);
    setTodaysTopThree([]);
    setOneThingId(null);
    setWebStorage(WEBSTORAGE_KEYS.TASKS, []);
    setWebStorage(WEBSTORAGE_KEYS.TRASH_TASKS, []);
    setWebStorage(WEBSTORAGE_KEYS.HABITS, []);
    setWebStorage(WEBSTORAGE_KEYS.PROJECTS, []);
    setWebStorage(WEBSTORAGE_KEYS.GOALS, []);
    setWebStorage(WEBSTORAGE_KEYS.SHOPPING, []);
    setWebStorage(WEBSTORAGE_KEYS.LIFE_ADMIN, []);
    setWebStorage(WEBSTORAGE_KEYS.STUDY_SUBJECTS, []);
  };

  const loadDemoData = () => {
    setIsCleanMode(false);
    setTasks(INITIAL_TASKS);
    setHabits(INITIAL_HABITS);
    setCheckins(INITIAL_CHECKINS);
    setStudySubjects(INITIAL_STUDY_SUBJECTS);
    setExams(INITIAL_EXAMS);
    setGoals(INITIAL_GOALS);
    setMemories(INITIAL_MEMORIES);
    setShoppingItems(INITIAL_SHOPPING);
    setLifeAdminItems(INITIAL_LIFE_ADMIN);
    setWebStorage(WEBSTORAGE_KEYS.TASKS, INITIAL_TASKS);
    setWebStorage(WEBSTORAGE_KEYS.HABITS, INITIAL_HABITS);
    setWebStorage(WEBSTORAGE_KEYS.GOALS, INITIAL_GOALS);
    setWebStorage(WEBSTORAGE_KEYS.SHOPPING, INITIAL_SHOPPING);
    setWebStorage(WEBSTORAGE_KEYS.LIFE_ADMIN, INITIAL_LIFE_ADMIN);
    setWebStorage(WEBSTORAGE_KEYS.STUDY_SUBJECTS, INITIAL_STUDY_SUBJECTS);
  };

  const deleteTaskProof = (taskId: string) => {
    const now = new Date().toISOString();
    setTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, proof: undefined, updatedAt: now } : t);
      setWebStorage(WEBSTORAGE_KEYS.TASKS, updated);
      return updated;
    });
  };

  const replaceTaskProof = (taskId: string, newUrl: string) => {
    const now = new Date().toISOString();

    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          const aiVerification = AIService.verifyPhotoProof(t.category, t.title, newUrl);
          const newProofObj = {
            id: generateId('proof'),
            taskId,
            imageUrl: newUrl,
            uploadedBy: currentUser.name.split(' ')[0],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            visibility: t.visibility,
            aiVerification
          };
          return {
            ...t,
            updatedAt: now,
            proof: newProofObj
          };
        }
        return t;
      });
      setWebStorage(WEBSTORAGE_KEYS.TASKS, updated);
      return updated;
    });
  };

  const toggleTaskSubtask = (taskId: string, subtaskId: string) => {
    const now = new Date().toISOString();

    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId && t.subtasks) {
          return {
            ...t,
            updatedAt: now,
            subtasks: t.subtasks.map(s => {
              if (s.id === subtaskId) {
                return { ...s, completed: !s.completed };
              }
              return s;
            })
          };
        }
        return t;
      });
      setWebStorage(WEBSTORAGE_KEYS.TASKS, updated);
      return updated;
    });
  };

  const toggleHabit = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => {
      const updated = prev.map(h => {
        if (h.id === habitId) {
          const existingLog = h.logs.find(l => l.date === today);
          let newLogs = [...h.logs];
          let newStreak = h.currentStreak;
          if (existingLog) {
            newLogs = newLogs.map(l => l.date === today ? { ...l, completed: !l.completed } : l);
            newStreak = Math.max(0, existingLog.completed ? newStreak - 1 : newStreak + 1);
          } else {
            newLogs.push({ date: today, completed: true });
            newStreak += 1;
          }
          const bestStreak = Math.max(newStreak, h.bestStreak);
          return {
            ...h,
            currentStreak: newStreak,
            bestStreak,
            logs: newLogs
          };
        }
        return h;
      });
      setWebStorage(WEBSTORAGE_KEYS.HABITS, updated);
      return updated;
    });
  };

  const addHabit = (title: string, category: string, frequency: Habit['frequency']) => {
    const newHabit: Habit = {
      id: generateId('habit'),
      spaceId: currentSpace.id,
      userId: currentUser.id,
      title,
      category,
      visibility: 'SHARED',
      currentStreak: 0,
      bestStreak: 0,
      recoveryCount: 0,
      frequency,
      logs: [],
      createdAt: new Date().toISOString()
    };
    setHabits(prev => {
      const updated = [...prev, newHabit];
      setWebStorage(WEBSTORAGE_KEYS.HABITS, updated);
      return updated;
    });
  };

  const addWater = (amountMl: number) => {
    setWaterIntake(prev => {
      const total = prev + amountMl;
      setWebStorage(WEBSTORAGE_KEYS.WATER, total);
      return total;
    });
  };

  const logSleep = (bedtime: string, wakeTime: string, durationMinutes: number, quality: number, notes?: string) => {
    const newLog: SleepLog = {
      id: generateId('sleep'),
      userId: currentUser.id,
      date: new Date().toISOString().split('T')[0],
      bedtime,
      wakeTime,
      durationMinutes,
      quality,
      notes,
      visibility: 'SHARED'
    };
    setSleepLogs(prev => {
      const updated = [newLog, ...prev];
      setWebStorage(WEBSTORAGE_KEYS.SLEEP, updated);
      return updated;
    });
  };

  const addMeal = (mealData: Omit<MealItem, 'id' | 'spaceId' | 'userId' | 'date'>) => {
    const newMeal: MealItem = {
      ...mealData,
      id: generateId('meal'),
      spaceId: currentSpace.id,
      userId: currentUser.id,
      date: new Date().toISOString().split('T')[0]
    };
    setMeals(prev => {
      const updated = [newMeal, ...prev];
      setWebStorage(WEBSTORAGE_KEYS.MEALS, updated);
      return updated;
    });
  };

  const addWorkout = (workoutData: Omit<WorkoutLog, 'id' | 'spaceId' | 'userId' | 'date'>) => {
    const newWorkout: WorkoutLog = {
      ...workoutData,
      id: generateId('wo'),
      spaceId: currentSpace.id,
      userId: currentUser.id,
      date: new Date().toISOString().split('T')[0]
    };
    setWorkouts(prev => {
      const updated = [newWorkout, ...prev];
      setWebStorage(WEBSTORAGE_KEYS.WORKOUTS, updated);
      return updated;
    });
  };

  const logDailyCheckin = (checkinData: Omit<DailyCheckin, 'id' | 'spaceId' | 'userId' | 'date' | 'createdAt'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newCheckin: DailyCheckin = {
      ...checkinData,
      id: generateId('chk'),
      spaceId: currentSpace.id,
      userId: currentUser.id,
      date: today,
      createdAt: new Date().toISOString()
    };
    setCheckins(prev => {
      const updated = [newCheckin, ...prev.filter(c => !(c.userId === currentUser.id && c.date === today))];
      setWebStorage(WEBSTORAGE_KEYS.CHECKINS, updated);
      return updated;
    });
  };

  const logCycle = (cycleData: Omit<CycleLog, 'id' | 'userId'>) => {
    const newCycle: CycleLog = {
      ...cycleData,
      id: generateId('cyc'),
      userId: currentUser.id,
      visibility: 'PRIVATE' // Always strictly private default
    };
    setCycleLogs(prev => [newCycle, ...prev]);
  };

  const addStudySubject = (name: string, code: string, color: string, targetHours: number) => {
    const newSubj: StudySubject = {
      id: generateId('subj'),
      spaceId: currentSpace.id,
      userId: currentUser.id,
      name,
      code,
      color,
      targetHoursWeekly: targetHours,
      topics: []
    };
    setStudySubjects(prev => {
      const updated = [...prev, newSubj];
      setWebStorage(WEBSTORAGE_KEYS.STUDY_SUBJECTS, updated);
      return updated;
    });
  };

  const updateTopicMastery = (subjectId: string, topicId: string, delta: number) => {
    setStudySubjects(prev => {
      const updated = prev.map(s => {
        if (s.id === subjectId) {
          return {
            ...s,
            topics: s.topics.map(t => {
              if (t.id === topicId) {
                const newMastery = Math.min(100, Math.max(0, t.masteryPercentage + delta));
                return { ...t, masteryPercentage: newMastery };
              }
              return t;
            })
          };
        }
        return s;
      });
      setWebStorage(WEBSTORAGE_KEYS.STUDY_SUBJECTS, updated);
      return updated;
    });
  };

  const logStudySession = (durationMins: number, focusMode: StudySession['focusMode'], subjectName?: string, learned?: string, photo?: string) => {
    const newSession: StudySession = {
      id: generateId('sess'),
      spaceId: currentSpace.id,
      userId: currentUser.id,
      date: new Date().toISOString().split('T')[0],
      durationMinutes: durationMins,
      focusMode,
      subjectName: subjectName || 'Independent Deep Study',
      learnedTakeaway: learned,
      learnedPhotoUrl: photo
    };
    setStudySessions(prev => {
      const updated = [newSession, ...prev];
      setWebStorage(WEBSTORAGE_KEYS.STUDY_SESSIONS, updated);
      return updated;
    });
  };

  const addExam = (examData: Omit<Exam, 'id' | 'spaceId' | 'userId'>) => {
    const newExam: Exam = {
      ...examData,
      id: generateId('exam'),
      spaceId: currentSpace.id,
      userId: currentUser.id
    };
    setExams(prev => {
      const updated = [...prev, newExam];
      setWebStorage(WEBSTORAGE_KEYS.EXAMS, updated);
      return updated;
    });
  };

  const deleteExam = (id: string) => {
    setExams(prev => {
      const updated = prev.filter(e => e.id !== id);
      setWebStorage(WEBSTORAGE_KEYS.EXAMS, updated);
      return updated;
    });
  };

  const toggleMealCheck = (slot: MealSlot, dishName?: string, forUserId?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const targetUserId = forUserId || currentUser.id;
    const targetUser = targetUserId === currentUser.id ? currentUser : (partnerUser || currentUser);
    const existing = dailyMealChecks.find(c => c.userId === targetUserId && c.date === today && c.slot === slot);
    const nowTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date());

    let updatedCheck: DailyMealCheck;
    if (existing) {
      updatedCheck = {
        ...existing,
        had: !existing.had,
        time: !existing.had ? nowTime : existing.time,
        dishName: dishName || existing.dishName,
        updatedAt: new Date().toISOString()
      };
    } else {
      updatedCheck = {
        id: generateId('mealchk'),
        spaceId: currentSpace.id,
        userId: targetUserId,
        userName: targetUser.name.split(' ')[0],
        date: today,
        slot,
        had: true,
        time: nowTime,
        dishName: dishName || undefined,
        updatedAt: new Date().toISOString()
      };
    }

    if (updatedCheck.had) {
      soundFx.playTaskCompleteChime();
    }

    setDailyMealChecks(prev => {
      const filtered = prev.filter(c => !(c.userId === targetUserId && c.date === today && c.slot === slot));
      const updated = [updatedCheck, ...filtered];
      setWebStorage(WEBSTORAGE_KEYS.DAILY_MEAL_CHECKS, updated);
      return updated;
    });
  };

  const saveDailyNote = (noteText: string, moodEmoji: string = '💌') => {
    const today = new Date().toISOString().split('T')[0];
    const newNote: DailyPartnerNote = {
      id: generateId('dnote'),
      spaceId: currentSpace.id,
      fromUserId: currentUser.id,
      fromUserName: currentUser.name.split(' ')[0],
      toUserId: partnerUser ? partnerUser.id : 'partner',
      date: today,
      note: noteText.trim(),
      moodEmoji,
      updatedAt: new Date().toISOString()
    };
    setDailyPartnerNotes(prev => {
      const filtered = prev.filter(n => !(n.fromUserId === currentUser.id && n.date === today));
      const updated = [newNote, ...filtered];
      setWebStorage(WEBSTORAGE_KEYS.DAILY_PARTNER_NOTES, updated);
      return updated;
    });
    soundFx.playPartnerNoteChime();
  };

  const addClassScheduleItem = (itemData: Omit<ClassScheduleItem, 'id'>) => {
    const newItem: ClassScheduleItem = {
      ...itemData,
      id: generateId('cs')
    };
    setClassSchedule(prev => {
      const updated = [...prev, newItem];
      setWebStorage(WEBSTORAGE_KEYS.CLASS_SCHEDULE, updated);
      return updated;
    });
  };

  // Project Actions
  const addProject = (title: string, description: string, deadline: string, isShared: boolean) => {
    const newProj: ProjectItem = {
      id: generateId('proj'),
      spaceId: currentSpace.id,
      userId: currentUser.id,
      title,
      description,
      deadline,
      status: 'ACTIVE',
      progress: 0,
      isShared,
      milestones: []
    };
    setProjects(prev => {
      const updated = [...prev, newProj];
      setWebStorage(WEBSTORAGE_KEYS.PROJECTS, updated);
      return updated;
    });
  };

  const toggleProjectMilestone = (projectId: string, milestoneId: string) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId) {
          const updatedMs = p.milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m);
          const comp = updatedMs.filter(m => m.completed).length;
          const pct = Math.round((comp / (updatedMs.length || 1)) * 100);
          return { ...p, milestones: updatedMs, progress: pct };
        }
        return p;
      });
      setWebStorage(WEBSTORAGE_KEYS.PROJECTS, updated);
      return updated;
    });
  };

  const addMilestoneToProject = (projectId: string, title: string, taskTitles: string[]) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId) {
          const newMs = {
            id: generateId('ms'),
            title,
            completed: false,
            tasks: taskTitles.map(t => ({ id: generateId('subt'), title: t, completed: false }))
          };
          return { ...p, milestones: [...p.milestones, newMs] };
        }
        return p;
      });
      setWebStorage(WEBSTORAGE_KEYS.PROJECTS, updated);
      return updated;
    });
  };

  // Shared Expenses
  const addSharedExpense = (title: string, amount: number, category: SharedExpense['category'], splitPct = 50) => {
    const newExp: SharedExpense = {
      id: generateId('exp'),
      spaceId: currentSpace.id,
      title,
      amount,
      category,
      paidByUserId: currentUser.id,
      paidByName: currentUser.name.split(' ')[0],
      splitPercentage: splitPct,
      isSettled: false,
      date: new Date().toISOString().split('T')[0]
    };
    setSharedExpenses(prev => {
      const updated = [newExp, ...prev];
      setWebStorage(WEBSTORAGE_KEYS.SHARED_EXPENSES, updated);
      return updated;
    });
  };

  const toggleSettleExpense = (id: string) => {
    setSharedExpenses(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, isSettled: !e.isSettled } : e);
      setWebStorage(WEBSTORAGE_KEYS.SHARED_EXPENSES, updated);
      return updated;
    });
  };

  // Trips & Packing
  const togglePackingItem = (tripId: string, itemId: string) => {
    setTrips(prev => {
      const updated = prev.map(t => {
        if (t.id === tripId) {
          return {
            ...t,
            packingList: t.packingList.map(p => p.id === itemId ? { ...p, packed: !p.packed } : p)
          };
        }
        return t;
      });
      setWebStorage(WEBSTORAGE_KEYS.TRIPS, updated);
      return updated;
    });
  };

  const addTrip = (tripData: Omit<TripItem, 'id' | 'spaceId'>) => {
    const newTrip: TripItem = {
      ...tripData,
      id: generateId('trip'),
      spaceId: currentSpace.id
    };
    setTrips(prev => {
      const updated = [...prev, newTrip];
      setWebStorage(WEBSTORAGE_KEYS.TRIPS, updated);
      return updated;
    });
  };

  // Subscriptions & Documents
  const addSubscription = (subData: Omit<SubscriptionItem, 'id' | 'userId'>) => {
    const newSub: SubscriptionItem = {
      ...subData,
      id: generateId('sub'),
      userId: currentUser.id
    };
    setSubscriptions(prev => [...prev, newSub]);
  };

  const addDocument = (docData: Omit<DocumentItem, 'id' | 'userId'>) => {
    const newDoc: DocumentItem = {
      ...docData,
      id: generateId('doc'),
      userId: currentUser.id
    };
    setDocuments(prev => [...prev, newDoc]);
  };

  // Skills, Reading, Challenges
  const logSkillPractice = (skillId: string, hours: number) => {
    setSkills(prev => prev.map(s => s.id === skillId ? { ...s, practiceHours: s.practiceHours + hours } : s));
  };

  const updateReadingProgress = (bookId: string, pagesRead: number) => {
    setReadingBooks(prev => prev.map(b => {
      if (b.id === bookId) {
        const newPages = Math.min(b.totalPages, pagesRead);
        return {
          ...b,
          pagesRead: newPages,
          status: newPages >= b.totalPages ? 'COMPLETED' : 'READING'
        };
      }
      return b;
    }));
  };

  const advanceChallengeDay = (challengeId: string) => {
    setChallenges(prev => prev.map(c => {
      if (c.id === challengeId) {
        const next = Math.min(c.targetDays, c.currentDay + 1);
        return { ...c, currentDay: next };
      }
      return c;
    }));
  };

  const addGoal = (goalData: Omit<Goal, 'id' | 'spaceId' | 'creatorId' | 'progress'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: generateId('goal'),
      spaceId: currentSpace.id,
      creatorId: currentUser.id,
      progress: 0
    };
    setGoals(prev => {
      const updated = [...prev, newGoal];
      setWebStorage(WEBSTORAGE_KEYS.GOALS, updated);
      return updated;
    });
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals(prev => {
      const updated = prev.map(g => {
        if (g.id === goalId) {
          const updatedMilestones = g.milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m);
          const completedCount = updatedMilestones.filter(m => m.completed).length;
          const progress = Math.round((completedCount / (updatedMilestones.length || 1)) * 100);
          return { ...g, milestones: updatedMilestones, progress };
        }
        return g;
      });
      setWebStorage(WEBSTORAGE_KEYS.GOALS, updated);
      return updated;
    });
  };

  const sendEncouragement = (message: string, emoji: string) => {
    if (!partnerUser) return;
    const newEnc: Encouragement = {
      id: generateId('enc'),
      spaceId: currentSpace.id,
      fromUserId: currentUser.id,
      fromUserName: currentUser.name.split(' ')[0],
      toUserId: partnerUser.id,
      message,
      emoji,
      timestamp: new Date().toISOString(),
      read: false
    };
    setEncouragements(prev => [newEnc, ...prev]);
    soundFx.playEncouragementChime();
  };

  const requestHelp = (category: HelpRequest['category'], message?: string) => {
    sendEncouragement(`I could use a little help with ${category}. ${message || ''}`.trim(), 'Help');
  };

  const addMemory = (memoryData: Omit<MemoryItem, 'id' | 'spaceId' | 'userId'>) => {
    const newMem: MemoryItem = {
      ...memoryData,
      id: generateId('mem'),
      spaceId: currentSpace.id,
      userId: currentUser.id
    };
    setMemories(prev => {
      const updated = [newMem, ...prev];
      setWebStorage(WEBSTORAGE_KEYS.MEMORIES, updated);
      return updated;
    });
  };

  const addLittleThing = (thingData: Omit<LittleThing, 'id' | 'spaceId' | 'userId'>) => {
    const newThing: LittleThing = {
      ...thingData,
      id: generateId('lt'),
      spaceId: currentSpace.id,
      userId: currentUser.id
    };
    setLittleThings(prev => [newThing, ...prev]);
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
      setWebStorage(WEBSTORAGE_KEYS.SHOPPING, updated);
      return updated;
    });
  };

  const addShoppingItem = (title: string, category: string) => {
    const newItem: ShoppingItem = {
      id: generateId('shop'),
      spaceId: currentSpace.id,
      userId: currentUser.id,
      title,
      category,
      completed: false,
      addedByName: currentUser.name.split(' ')[0],
      createdAt: new Date().toISOString()
    };
    setShoppingItems(prev => {
      const updated = [newItem, ...prev];
      setWebStorage(WEBSTORAGE_KEYS.SHOPPING, updated);
      return updated;
    });
  };

  const addLifeAdminItem = (itemData: Omit<LifeAdminItem, 'id' | 'spaceId' | 'userId' | 'status'>) => {
    const newItem: LifeAdminItem = {
      ...itemData,
      id: generateId('la'),
      spaceId: currentSpace.id,
      userId: currentUser.id,
      status: 'PENDING'
    };
    setLifeAdminItems(prev => {
      const updated = [newItem, ...prev];
      setWebStorage(WEBSTORAGE_KEYS.LIFE_ADMIN, updated);
      return updated;
    });
  };

  const toggleLifeAdminStatus = (id: string) => {
    setLifeAdminItems(prev => {
      const updated = prev.map(item => item.id === id ? {
        ...item,
        status: (item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED') as LifeAdminItem['status']
      } : item);
      setWebStorage(WEBSTORAGE_KEYS.LIFE_ADMIN, updated);
      return updated;
    });
  };

  const addKnowledgeItem = (title: string, category: KnowledgeItem['category'], content: string, tags: string[]) => {
    const newItem: KnowledgeItem = {
      id: generateId('kn'),
      spaceId: currentSpace.id,
      userId: currentUser.id,
      title,
      category,
      content,
      tags
    };
    setKnowledgeItems(prev => [newItem, ...prev]);
  };

  return (
    <LifeOSContext.Provider
      value={{
        currentUser,
        currentSpace,
        partnerUser,
        tasks,
        trashTasks,
        habits,
        checkins,
        studySubjects,
        exams,
        studySessions,
        goals,
        memories,
        littleThings,
        shoppingItems,
        lifeAdminItems,
        knowledgeItems,
        encouragements,
        events,
        achievements,
        waterIntake,
        sleepLogs,
        meals,
        workouts,
        cycleLogs,
        projects,
        classSchedule,
        sharedExpenses,
        trips,
        subscriptions,
        documents,
        skills,
        readingBooks,
        challenges,
        specialMode,
        setSpecialMode,
        todaysTopThree,
        setTodaysTopThree,
        oneThingId,
        setOneThingId,
        activeView,
        setActiveView,
        lightbox,
        openLightbox,
        closeLightbox,
        switchUser,
        setAccentColor,
        setTheme,
        updateProfile,
        joinSpace,
        createSpace,
        addTask,
        toggleTask,
        snoozeTask,
        rescheduleTask,
        deleteTask,
        restoreTask,
        deleteTaskProof,
        replaceTaskProof,
        toggleTaskSubtask,
        isCleanMode,
        setIsCleanMode,
        loadDemoData,
        resetToCleanSlate,
        activeReminderAlert,
        dismissReminderAlert,
        requestNotificationPermission,
        toggleHabit,
        addHabit,
        addWater,
        logSleep,
        addMeal,
        addWorkout,
        logDailyCheckin,
        logCycle,
        addStudySubject,
        updateTopicMastery,
        logStudySession,
        addExam,
        addClassScheduleItem,
        addProject,
        toggleProjectMilestone,
        addMilestoneToProject,
        addSharedExpense,
        toggleSettleExpense,
        togglePackingItem,
        addTrip,
        addSubscription,
        addDocument,
        logSkillPractice,
        updateReadingProgress,
        advanceChallengeDay,
        addGoal,
        toggleMilestone,
        sendEncouragement,
        requestHelp,
        addMemory,
        addLittleThing,
        toggleShoppingItem,
        addShoppingItem,
        addLifeAdminItem,
        toggleLifeAdminStatus,
        addKnowledgeItem,
        dailyPartnerNotes,
        saveDailyNote,
        deleteExam,
        cloudSyncStatus,
        dailyMealChecks,
        toggleMealCheck,
        triggerSync: () => resyncRef.current()
      }}
    >
      {children}

      {/* Real In-App Actionable Reminder Alert Banner */}
      {activeReminderAlert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-card border-2 border-primary/40 rounded-3xl p-5 shadow-2xl animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
              <Bell className="h-3.5 w-3.5 inline mr-1" />
              <span>Due Now Reminder</span>
            </div>
            <button
              onClick={dismissReminderAlert}
              className="text-muted-foreground hover:text-foreground text-xs p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2 space-y-1">
            <h4 className="text-sm font-extrabold text-foreground">
              {activeReminderAlert.task_title || activeReminderAlert.title}
            </h4>
            <p className="text-xs text-muted-foreground">
              This task is scheduled for right now. What would you like to do?
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 pt-1 border-t border-border/60">
            {activeReminderAlert.task_id && (
              <button
                type="button"
                onClick={() => {
                  toggleTask(activeReminderAlert.task_id);
                  dismissReminderAlert();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
              >
                Mark Complete
              </button>
            )}

            {activeReminderAlert.task_id && (
              <button
                type="button"
                onClick={() => {
                  snoozeTask(activeReminderAlert.task_id, 10);
                  dismissReminderAlert();
                }}
                className="px-3 py-1.5 rounded-xl border border-border bg-secondary hover:bg-muted font-bold text-xs text-foreground"
              >
                Snooze 10m
              </button>
            )}

            {activeReminderAlert.task_id && (
              <button
                type="button"
                onClick={() => {
                  snoozeTask(activeReminderAlert.task_id, 30);
                  dismissReminderAlert();
                }}
                className="px-3 py-1.5 rounded-xl border border-border bg-secondary hover:bg-muted font-bold text-xs text-foreground"
              >
                Snooze 30m
              </button>
            )}

            <button
              type="button"
              onClick={dismissReminderAlert}
              className="px-3 py-1.5 rounded-xl text-muted-foreground hover:text-foreground font-semibold text-xs ml-auto"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </LifeOSContext.Provider>
  );
}

export function useLifeOS() {
  const context = useContext(LifeOSContext);
  if (!context) {
    throw new Error('useLifeOS must be used within a LifeOSProvider');
  }
  return context;
}
