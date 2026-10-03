'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  SpecialMode
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
  deleteTask: (taskId: string) => void;
  restoreTask: (taskId: string) => void;
  deleteTaskProof: (taskId: string) => void;
  replaceTaskProof: (taskId: string, newUrl: string) => void;
  toggleTaskSubtask: (taskId: string, subtaskId: string) => void;
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
}

const LifeOSContext = createContext<LifeOSContextType | undefined>(undefined);

export function LifeOSProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_PROFILES.user_shanmukh);
  const [currentSpace, setCurrentSpace] = useState<Space>(DEMO_SPACE);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [trashTasks, setTrashTasks] = useState<TaskItem[]>([]);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [checkins, setCheckins] = useState<DailyCheckin[]>(INITIAL_CHECKINS);
  const [studySubjects, setStudySubjects] = useState<StudySubject[]>(INITIAL_STUDY_SUBJECTS);
  const [exams, setExams] = useState<Exam[]>(INITIAL_EXAMS);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [memories, setMemories] = useState<MemoryItem[]>(INITIAL_MEMORIES);
  const [littleThings, setLittleThings] = useState<LittleThing[]>(INITIAL_LITTLE_THINGS);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(INITIAL_SHOPPING);
  const [lifeAdminItems, setLifeAdminItems] = useState<LifeAdminItem[]>(INITIAL_LIFE_ADMIN);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>(INITIAL_KNOWLEDGE);
  const [encouragements, setEncouragements] = useState<Encouragement[]>(INITIAL_ENCOURAGEMENTS);
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  
  // New upgrade state
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [classSchedule, setClassSchedule] = useState<ClassScheduleItem[]>(INITIAL_CLASS_SCHEDULE);
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpense[]>(INITIAL_SHARED_EXPENSES);
  const [trips, setTrips] = useState<TripItem[]>(INITIAL_TRIPS);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(INITIAL_SUBSCRIPTIONS);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [skills, setSkills] = useState<SkillItem[]>(INITIAL_SKILLS);
  const [readingBooks, setReadingBooks] = useState<ReadingBook[]>(INITIAL_READING);
  const [challenges, setChallenges] = useState<PersonalChallenge[]>(INITIAL_CHALLENGES);

  // Modes & Focus
  const [specialMode, setSpecialMode] = useState<SpecialMode>('NORMAL');
  const [todaysTopThree, setTodaysTopThree] = useState<string[]>(['task_1', 'task_2', 'task_4']);
  const [oneThingId, setOneThingId] = useState<string | null>('task_1');

  // Lightbox
  const [lightbox, setLightbox] = useState<LightboxData | null>(null);

  const [waterIntake, setWaterIntake] = useState<number>(1750);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([
    {
      id: 'sleep_1',
      userId: 'user_shanmukh',
      date: new Date().toISOString().split('T')[0],
      bedtime: '23:15',
      wakeTime: '06:50',
      durationMinutes: 455,
      quality: 4,
      visibility: 'SHARED'
    }
  ]);
  const [meals, setMeals] = useState<MealItem[]>([
    {
      id: 'meal_1',
      spaceId: 'space_lifeos_demo',
      userId: 'user_shanmukh',
      date: new Date().toISOString().split('T')[0],
      mealType: 'Breakfast',
      food: '3 scrambled eggs with avocado and sourdough toast',
      estimatedCalories: 580,
      photoUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80',
      visibility: 'SHARED',
      time: '08:15 AM'
    }
  ]);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([
    {
      id: 'wo_1',
      spaceId: 'space_lifeos_demo',
      userId: 'user_shanmukh',
      date: new Date().toISOString().split('T')[0],
      type: 'Strength',
      durationMinutes: 45,
      exercises: [
        { name: 'Dumbbell Bench Press', sets: 4, reps: 10, weightKg: 26 },
        { name: 'Bent-Over Dumbbell Rows', sets: 4, reps: 12, weightKg: 24 },
        { name: 'Overhead Shoulder Press', sets: 3, reps: 10, weightKg: 18 }
      ],
      photoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80',
      notes: 'Felt very explosive on the press today.',
      visibility: 'SHARED'
    }
  ]);
  const [cycleLogs, setCycleLogs] = useState<CycleLog[]>([
    {
      id: 'cycle_1',
      userId: 'user_satvika',
      periodStartDate: '2026-09-24',
      cycleLengthDays: 28,
      periodDurationDays: 5,
      symptoms: ['Mild cramps', 'Fatigue day 1'],
      mood: 'Calm',
      energyLevel: 6,
      visibility: 'PRIVATE' // Strictly PRIVATE by default
    }
  ]);

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

  const addTask = (taskData: Omit<TaskItem, 'id' | 'spaceId' | 'creatorId' | 'createdAt' | 'updatedAt'>) => {
    const newTask: TaskItem = {
      ...taskData,
      id: generateId('task'),
      spaceId: currentSpace.id,
      creatorId: currentUser.id,
      assignedToId: taskData.assignedToId || currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTask = (taskId: string, proofImg?: string): { success: boolean; error?: string } => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return { success: false, error: 'TASK_NOT_FOUND' };

    const isCompleting = target.status !== 'COMPLETED';
    // Part 14: IF proofRequired == true AND no proof exists/provided THEN reject completion with PROOF_REQUIRED
    if (isCompleting && target.proofRequired && !proofImg && !target.proof) {
      console.warn(`[Task Proof Policy] Rejected completion for "${target.title}": PROOF_REQUIRED.`);
      return { success: false, error: 'PROOF_REQUIRED' };
    }

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const isDone = t.status === 'COMPLETED';
        const aiVerification = proofImg 
          ? AIService.verifyPhotoProof(t.category, t.title, proofImg) 
          : undefined;

        return {
          ...t,
          status: isDone ? 'TODO' : 'COMPLETED',
          completedAt: isDone ? undefined : new Date().toISOString(),
          proof: proofImg ? {
            id: generateId('proof'),
            taskId,
            imageUrl: proofImg,
            uploadedBy: currentUser.name.split(' ')[0],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            visibility: t.visibility,
            aiVerification
          } : t.proof
        };
      }
      return t;
    }));

    return { success: true };
  };

  // Soft delete task to trash for recovery
  const deleteTask = (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (target) {
      setTrashTasks(prev => [{ ...target, deletedAt: new Date().toISOString() }, ...prev]);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const restoreTask = (taskId: string) => {
    const target = trashTasks.find(t => t.id === taskId);
    if (target) {
      setTrashTasks(prev => prev.filter(t => t.id !== taskId));
      setTasks(prev => [target, ...prev]);
    }
  };

  const deleteTaskProof = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, proof: undefined } : t));
  };

  const replaceTaskProof = (taskId: string, newUrl: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const aiVerification = AIService.verifyPhotoProof(t.category, t.title, newUrl);
        return {
          ...t,
          proof: {
            id: generateId('proof'),
            taskId,
            imageUrl: newUrl,
            uploadedBy: currentUser.name.split(' ')[0],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            visibility: t.visibility,
            aiVerification
          }
        };
      }
      return t;
    }));
  };

  const toggleTaskSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.subtasks) {
        return {
          ...t,
          subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
        };
      }
      return t;
    }));
  };

  const toggleHabit = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
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
        return {
          ...h,
          currentStreak: newStreak,
          bestStreak: Math.max(newStreak, h.bestStreak),
          logs: newLogs
        };
      }
      return h;
    }));
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
    setHabits(prev => [...prev, newHabit]);
  };

  const addWater = (amountMl: number) => {
    setWaterIntake(prev => prev + amountMl);
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
    setSleepLogs(prev => [newLog, ...prev]);
  };

  const addMeal = (mealData: Omit<MealItem, 'id' | 'spaceId' | 'userId' | 'date'>) => {
    const newMeal: MealItem = {
      ...mealData,
      id: generateId('meal'),
      spaceId: currentSpace.id,
      userId: currentUser.id,
      date: new Date().toISOString().split('T')[0]
    };
    setMeals(prev => [newMeal, ...prev]);
  };

  const addWorkout = (workoutData: Omit<WorkoutLog, 'id' | 'spaceId' | 'userId' | 'date'>) => {
    const newWorkout: WorkoutLog = {
      ...workoutData,
      id: generateId('wo'),
      spaceId: currentSpace.id,
      userId: currentUser.id,
      date: new Date().toISOString().split('T')[0]
    };
    setWorkouts(prev => [newWorkout, ...prev]);
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
    setCheckins(prev => [newCheckin, ...prev.filter(c => !(c.userId === currentUser.id && c.date === today))]);
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
    setStudySubjects(prev => [...prev, newSubj]);
  };

  const updateTopicMastery = (subjectId: string, topicId: string, delta: number) => {
    setStudySubjects(prev => prev.map(s => {
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
    }));
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
    setStudySessions(prev => [newSession, ...prev]);
  };

  const addExam = (examData: Omit<Exam, 'id' | 'spaceId' | 'userId'>) => {
    const newExam: Exam = {
      ...examData,
      id: generateId('exam'),
      spaceId: currentSpace.id,
      userId: currentUser.id
    };
    setExams(prev => [...prev, newExam]);
  };

  const addClassScheduleItem = (itemData: Omit<ClassScheduleItem, 'id'>) => {
    const newItem: ClassScheduleItem = {
      ...itemData,
      id: generateId('cs')
    };
    setClassSchedule(prev => [...prev, newItem]);
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
    setProjects(prev => [...prev, newProj]);
  };

  const toggleProjectMilestone = (projectId: string, milestoneId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updated = p.milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m);
        const comp = updated.filter(m => m.completed).length;
        const pct = Math.round((comp / (updated.length || 1)) * 100);
        return { ...p, milestones: updated, progress: pct };
      }
      return p;
    }));
  };

  const addMilestoneToProject = (projectId: string, title: string, taskTitles: string[]) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newMs = {
          id: generateId('ms'),
          title,
          completed: false,
          tasks: taskTitles.map(t => ({ id: generateId('subt'), title: t, completed: false }))
        };
        const updated = [...p.milestones, newMs];
        return { ...p, milestones: updated };
      }
      return p;
    }));
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
    setSharedExpenses(prev => [newExp, ...prev]);
  };

  const toggleSettleExpense = (id: string) => {
    setSharedExpenses(prev => prev.map(e => e.id === id ? { ...e, isSettled: !e.isSettled } : e));
  };

  // Trips & Packing
  const togglePackingItem = (tripId: string, itemId: string) => {
    setTrips(prev => prev.map(t => {
      if (t.id === tripId) {
        return {
          ...t,
          packingList: t.packingList.map(p => p.id === itemId ? { ...p, packed: !p.packed } : p)
        };
      }
      return t;
    }));
  };

  const addTrip = (tripData: Omit<TripItem, 'id' | 'spaceId'>) => {
    const newTrip: TripItem = {
      ...tripData,
      id: generateId('trip'),
      spaceId: currentSpace.id
    };
    setTrips(prev => [...prev, newTrip]);
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
    setGoals(prev => [...prev, newGoal]);
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const updatedMilestones = g.milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m);
        const completedCount = updatedMilestones.filter(m => m.completed).length;
        const progress = Math.round((completedCount / (updatedMilestones.length || 1)) * 100);
        return { ...g, milestones: updatedMilestones, progress };
      }
      return g;
    }));
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
  };

  const requestHelp = (category: HelpRequest['category'], message?: string) => {
    sendEncouragement(`I could use a little help with ${category}. ${message || ''}`.trim(), '🤝');
  };

  const addMemory = (memoryData: Omit<MemoryItem, 'id' | 'spaceId' | 'userId'>) => {
    const newMem: MemoryItem = {
      ...memoryData,
      id: generateId('mem'),
      spaceId: currentSpace.id,
      userId: currentUser.id
    };
    setMemories(prev => [newMem, ...prev]);
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
    setShoppingItems(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
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
    setShoppingItems(prev => [newItem, ...prev]);
  };

  const addLifeAdminItem = (itemData: Omit<LifeAdminItem, 'id' | 'spaceId' | 'userId' | 'status'>) => {
    const newItem: LifeAdminItem = {
      ...itemData,
      id: generateId('la'),
      spaceId: currentSpace.id,
      userId: currentUser.id,
      status: 'PENDING'
    };
    setLifeAdminItems(prev => [newItem, ...prev]);
  };

  const toggleLifeAdminStatus = (id: string) => {
    setLifeAdminItems(prev => prev.map(item => item.id === id ? {
      ...item,
      status: item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
    } : item));
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
        deleteTask,
        restoreTask,
        deleteTaskProof,
        replaceTaskProof,
        toggleTaskSubtask,
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
      }}
    >
      {children}
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
