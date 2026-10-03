export type Role = 'OWNER' | 'PARTNER';

export type Visibility = 'PRIVATE' | 'SHARED';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'MUST_DO';

export type TaskCategory = 
  | 'Study'
  | 'College'
  | 'Work'
  | 'Fitness'
  | 'Health'
  | 'Food'
  | 'Personal'
  | 'Household'
  | 'Relationship'
  | 'Life Admin'
  | 'Project'
  | 'Other';

export type TaskRecurrence = 
  | 'NONE'
  | 'DAILY'
  | 'WEEKDAYS'
  | 'WEEKENDS'
  | 'WEEKLY'
  | 'MONTHLY';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type SpecialMode = 'NORMAL' | 'WEEKEND' | 'REST_DAY' | 'TRAVEL' | 'EXAM';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  accentColor: string;
  theme: 'light' | 'dark' | 'system';
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  fitnessGoal?: string;
  activityLevel?: string;
  workoutPreference?: string;
  availableEquipment?: string;
  workoutDuration?: number; // in mins
  preferredWorkoutTime?: string;
  sleepTargetHours: number;
  wakeTargetTime: string; // e.g. "07:00"
  waterTargetMl: number; // e.g. 2500
  dietaryPreference?: 'vegetarian' | 'eggitarian' | 'non-vegetarian' | 'vegan';
  allergies?: string[];
  dislikedFoods?: string[];
  favoriteFoods?: string[];
  collegeOrWork?: string;
  subjects?: string[];
  dailyStudyTargetHours?: number;
  preferredPlanningStyle?: string;
}

export interface SpaceMember {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  joinedAt: string;
  accentColor?: string;
}

export interface Space {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
  members: SpaceMember[];
}

export interface TaskProof {
  id: string;
  taskId: string;
  imageUrl: string;
  uploadedBy: string;
  timestamp: string;
  visibility?: Visibility;
  aiVerification?: {
    verified: boolean;
    confidence: number; // e.g. 96.8
    detectedObjects: string[];
    summary: string;
    verifiedAt: string;
    verificationHash?: string;
  };
}

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  spaceId: string;
  creatorId: string;
  assignedToId?: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: Priority;
  visibility: Visibility;
  status: TaskStatus;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  recurrence: TaskRecurrence;
  estimatedMinutes?: number;
  completedAt?: string;
  proofRequired?: boolean;
  proof?: TaskProof;
  notes?: string;
  dependsOnTaskId?: string;
  isBlocked?: boolean;
  blockerReason?: string;
  subtasks?: TaskSubtask[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; // For soft-delete recovery
}

export interface HabitLog {
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
}

export interface Habit {
  id: string;
  spaceId: string;
  userId: string;
  title: string;
  category: string;
  visibility: Visibility;
  currentStreak: number;
  bestStreak: number;
  frequency: 'DAILY' | 'WEEKDAYS' | 'WEEKENDS' | 'CUSTOM';
  logs: HabitLog[];
  recoveryCount: number;
  createdAt: string;
}

export interface DailyCheckin {
  id: string;
  spaceId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mood: 'Great' | 'Good' | 'Okay' | 'Low' | 'Tired';
  energy: number; // 1-10
  stress: number; // 1-10
  mainGoal: string;
  notes?: string;
  needsHelpWith?: string;
  photoUrl?: string;
  visibility: Visibility;
  createdAt: string;
}

export interface WaterLog {
  id: string;
  userId: string;
  date: string;
  amountMl: number;
  targetMl: number;
  history: { time: string; amount: number }[];
}

export interface SleepLog {
  id: string;
  userId: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  durationMinutes: number;
  quality: number; // 1-5
  notes?: string;
  visibility: Visibility;
}

export interface MealItem {
  id: string;
  spaceId: string;
  userId: string;
  date: string;
  mealType: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner' | 'Other';
  food: string;
  portion?: string;
  estimatedCalories?: number;
  photoUrl?: string;
  notes?: string;
  visibility: Visibility;
  time: string;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number;
  weightKg?: number;
}

export interface WorkoutLog {
  id: string;
  spaceId: string;
  userId: string;
  date: string;
  type: 'Strength' | 'Cardio' | 'Walking' | 'Running' | 'Cycling' | 'Mobility' | 'Yoga' | 'Bodyweight' | 'Gym' | 'Sports';
  durationMinutes: number;
  exercises: WorkoutExercise[];
  notes?: string;
  photoUrl?: string;
  visibility: Visibility;
}

export interface CycleLog {
  id: string;
  userId: string;
  periodStartDate: string;
  cycleLengthDays: number;
  periodDurationDays: number;
  symptoms: string[];
  mood: string;
  energyLevel: number;
  notes?: string;
  visibility: Visibility; // Strictly PRIVATE default
}

export interface StudyTopic {
  id: string;
  title: string;
  masteryPercentage: number;
  isWeakTopic?: boolean;
}

export interface StudySubject {
  id: string;
  spaceId: string;
  userId: string;
  name: string;
  code?: string;
  color: string;
  targetHoursWeekly: number;
  topics: StudyTopic[];
}

export interface Exam {
  id: string;
  spaceId: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  date: string;
  topics: string[];
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  revisionProgress: number; // 0-100
  notes?: string;
}

export interface StudySession {
  id: string;
  spaceId: string;
  userId: string;
  subjectId?: string;
  subjectName?: string;
  date: string;
  durationMinutes: number;
  focusMode: '25m' | '50m' | '90m' | 'Custom';
  notes?: string;
  learnedTakeaway?: string;
  learnedPhotoUrl?: string;
}

export interface ClassScheduleItem {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  subjectName: string;
  room?: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  color: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  completed: boolean;
  tasks: { id: string; title: string; completed: boolean }[];
}

export interface ProjectItem {
  id: string;
  spaceId: string;
  userId: string;
  title: string;
  description: string;
  deadline: string;
  status: 'ACTIVE' | 'BLOCKED' | 'COMPLETED';
  blockerReason?: string;
  progress: number;
  milestones: ProjectMilestone[];
  isShared: boolean;
}

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  spaceId: string;
  creatorId: string;
  isShared: boolean; // US GOAL vs PERSONAL
  category: 'Academics' | 'Career' | 'Fitness' | 'Projects' | 'Reading' | 'Skills' | 'Financial' | 'Personal' | 'Relationship';
  title: string;
  description?: string;
  targetDate: string;
  milestones: GoalMilestone[];
  progress: number; // 0-100
  visibility: Visibility;
}

export interface SharedExpense {
  id: string;
  spaceId: string;
  title: string;
  amount: number;
  category: 'Food' | 'Trips' | 'Shopping' | 'Projects' | 'Events' | 'Household';
  paidByUserId: string;
  paidByName: string;
  splitPercentage: number; // 50 means 50/50
  isSettled: boolean;
  date: string;
}

export interface TripPackingItem {
  id: string;
  item: string;
  packed: boolean;
  category: string;
}

export interface TripItem {
  id: string;
  spaceId: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  places: string[];
  activities: string[];
  packingList: TripPackingItem[];
  isShared: boolean;
}

export interface SubscriptionItem {
  id: string;
  userId: string;
  name: string;
  cost: number;
  billingCycle: 'Monthly' | 'Yearly';
  renewalDate: string;
  category: string;
  reminderEnabled: boolean;
}

export interface DocumentItem {
  id: string;
  userId: string;
  title: string;
  documentType: 'Passport' | 'ID' | 'License' | 'Certificate' | 'College ID' | 'Insurance';
  expiryDate: string;
  notes?: string;
}

export interface SkillItem {
  id: string;
  userId: string;
  name: string;
  category: string;
  currentLevel: string;
  targetLevel: string;
  practiceHours: number;
  resources: string[];
}

export interface ReadingBook {
  id: string;
  userId: string;
  title: string;
  author: string;
  totalPages: number;
  pagesRead: number;
  status: 'READING' | 'COMPLETED' | 'WANT_TO_READ';
  notes?: string;
}

export interface PersonalChallenge {
  id: string;
  userId: string;
  title: string;
  targetDays: number;
  currentDay: number;
  isShared: boolean;
  category: string;
}

export interface Encouragement {
  id: string;
  spaceId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  message: string;
  emoji: string;
  timestamp: string;
  read: boolean;
}

export interface HelpRequest {
  id: string;
  spaceId: string;
  userId: string;
  userName: string;
  category: 'Study' | 'Workout' | 'Productivity' | 'Technical' | 'Time management' | 'Feeling overwhelmed' | 'Food' | 'Just need someone';
  message?: string;
  resolved: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  spaceId: string;
  userId: string;
  date: string;
  title: string;
  content: string;
  mood: string;
  gratitude: string[];
  highlights?: string;
  lessons?: string;
  photos: string[];
  visibility: Visibility; // Default PRIVATE
}

export interface MemoryItem {
  id: string;
  spaceId: string;
  userId: string;
  title: string;
  date: string;
  category: 'Trip' | 'Achievement' | 'Milestone' | 'Special Day' | 'Shared Activity' | 'Fun';
  photoUrl?: string;
  notes: string;
}

export interface LittleThing {
  id: string;
  spaceId: string;
  userId: string;
  forPartner: boolean;
  category: 'Favorite Food' | 'Gift Idea' | 'Partner Mentioned' | 'Reminder' | 'Future Plan' | 'Surprise Idea';
  title: string;
  details?: string;
}

export interface EventItem {
  id: string;
  spaceId: string;
  userId: string;
  title: string;
  category: 'Birthday' | 'Anniversary' | 'Exam' | 'Trip' | 'Appointment' | 'Deadline' | 'Milestone';
  date: string;
  time?: string;
  isShared: boolean;
  notes?: string;
}

export interface ShoppingItem {
  id: string;
  spaceId: string;
  userId: string;
  title: string;
  category: string;
  completed: boolean;
  addedByName: string;
  createdAt: string;
}

export interface LifeAdminItem {
  id: string;
  spaceId: string;
  userId: string;
  title: string;
  category: 'Bill' | 'Payment' | 'Document' | 'Renewal' | 'Appointment' | 'Repair' | 'Purchase';
  dueDate?: string;
  amount?: number;
  status: 'PENDING' | 'COMPLETED';
  notes?: string;
}

export interface KnowledgeItem {
  id: string;
  spaceId: string;
  userId: string;
  title: string;
  category: 'Article' | 'Book' | 'Idea' | 'Research' | 'Useful Link' | 'Learning';
  content: string;
  tags: string[];
  url?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface SyllabusTopicItem {
  id: string;
  title: string;
  completed: boolean;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  estimatedHours?: number;
}

export interface SyllabusUnit {
  id: string;
  unitNumber: number;
  title: string;
  topics: SyllabusTopicItem[];
}

export interface StudyPlanDay {
  dayNumber: number;
  date: string;
  topics: string[];
  durationMinutes: number;
  mode: 'LEARN' | 'PRACTICE' | 'REVISE' | 'MOCK_TEST';
  isCompleted?: boolean;
}

export interface ActiveRecallQuestion {
  id: string;
  topic: string;
  type: 'MCQ' | 'VIVA' | 'DERIVATION';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
}

export interface TeachMeTopic {
  topic: string;
  prerequisite: string;
  intuition: string;
  formalExplanation: string;
  workedExample: string;
  commonMistakes: string;
  quiz: {
    question: string;
    answer: string;
  };
}
