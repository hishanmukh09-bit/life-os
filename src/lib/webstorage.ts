/**
 * WebStorage Utility for LifeOS
 * Provides permanent, resilient browser localStorage persistence across sessions,
 * tab closures, and browser restarts.
 */

export const WEBSTORAGE_KEYS = {
  TASKS: 'lifeos_permanent_tasks',
  TRASH_TASKS: 'lifeos_permanent_trash_tasks',
  HABITS: 'lifeos_permanent_habits',
  CHECKINS: 'lifeos_permanent_checkins',
  STUDY_SUBJECTS: 'lifeos_permanent_study_subjects',
  EXAMS: 'lifeos_permanent_exams',
  STUDY_SESSIONS: 'lifeos_permanent_study_sessions',
  GOALS: 'lifeos_permanent_goals',
  MEMORIES: 'lifeos_permanent_memories',
  LITTLE_THINGS: 'lifeos_permanent_little_things',
  SHOPPING: 'lifeos_permanent_shopping',
  LIFE_ADMIN: 'lifeos_permanent_life_admin',
  KNOWLEDGE: 'lifeos_permanent_knowledge',
  ENCOURAGEMENTS: 'lifeos_permanent_encouragements',
  EVENTS: 'lifeos_permanent_events',
  ACHIEVEMENTS: 'lifeos_permanent_achievements',
  PROJECTS: 'lifeos_permanent_projects',
  CLASS_SCHEDULE: 'lifeos_permanent_class_schedule',
  SHARED_EXPENSES: 'lifeos_permanent_shared_expenses',
  TRIPS: 'lifeos_permanent_trips',
  SUBSCRIPTIONS: 'lifeos_permanent_subscriptions',
  DOCUMENTS: 'lifeos_permanent_documents',
  SKILLS: 'lifeos_permanent_skills',
  READING: 'lifeos_permanent_reading',
  CHALLENGES: 'lifeos_permanent_challenges',
  WATER: 'lifeos_permanent_water',
  SLEEP: 'lifeos_permanent_sleep',
  MEALS: 'lifeos_permanent_meals',
  WORKOUTS: 'lifeos_permanent_workouts',
  CYCLE: 'lifeos_permanent_cycle',
  SPECIAL_MODE: 'lifeos_permanent_special_mode',
  TOP_THREE: 'lifeos_permanent_top_three',
  ONE_THING: 'lifeos_permanent_one_thing',
  IS_CLEAN_MODE: 'lifeos_permanent_clean_mode',
  CURRENT_USER: 'lifeos_permanent_user',
  CURRENT_SPACE: 'lifeos_permanent_space'
} as const;

export function getWebStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) return defaultValue;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? (parsed as T) : defaultValue;
  } catch (error) {
    console.warn(`[WebStorage] Error reading "${key}":`, error);
    return defaultValue;
  }
}

export function setWebStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[WebStorage] Error saving "${key}":`, error);
    return false;
  }
}

export function removeWebStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[WebStorage] Error removing "${key}":`, error);
  }
}
