import { TaskItem, Habit, UserProfile, StudySubject, Exam, SleepLog, WorkoutLog, Goal } from '@/types';

export interface RescueScheduleResult {
  keep: TaskItem[];
  move: TaskItem[];
  optional: TaskItem[];
  rationale: string;
}

export interface NextActionResult {
  actionTitle: string;
  rationale: string;
  estimatedMinutes: number;
  upcomingSequence: string[];
}

export interface TomorrowPlanResult {
  wakeTarget: string;
  morningRoutine: string[];
  priorityTasks: string[];
  studyPlan: string;
  restPlan: string;
  encouragement: string;
}

export const AIService = {
  // WHAT SHOULD I DO NOW?
  getWhatShouldIDoNow(
    user: UserProfile,
    tasks: TaskItem[],
    now: Date = new Date()
  ): NextActionResult {
    const uncompletedTasks = tasks.filter(t => t.status !== 'COMPLETED');
    const mustDo = uncompletedTasks.find(t => t.priority === 'MUST_DO');
    const high = uncompletedTasks.find(t => t.priority === 'HIGH');
    const target = mustDo || high || uncompletedTasks[0];

    const currentHour = now.getHours();

    if (currentHour >= 22) {
      return {
        actionTitle: 'Wind down and prepare for sleep',
        rationale: `It's past 10:00 PM. Your target wake time is ${user.wakeTargetTime}. Prioritize cellular restoration and deep sleep over late-night screens.`,
        estimatedMinutes: 20,
        upcomingSequence: ['Herbal tea / hydration check', 'Journal reflection', 'Lights out by 11:00 PM']
      };
    }

    if (target) {
      return {
        actionTitle: `Focus 35 minutes on: ${target.title}`,
        rationale: `This is flagged as [${target.priority}] priority in ${target.category}. Completing this unlocks significant mental momentum for the rest of your day.`,
        estimatedMinutes: target.estimatedMinutes || 35,
        upcomingSequence: [
          'Hydrate with 250ml water',
          'Review upcoming deadlines on Deadline Radar',
          'Evening dinner & recharge with partner'
        ]
      };
    }

    return {
      actionTitle: 'Take a mindful 15-minute mobility or hydration break',
      rationale: 'You have cleared all active priority items for this block! Give your mind a reset before planning tomorrow.',
      estimatedMinutes: 15,
      upcomingSequence: ['Step outside for daylight', 'Check in on partner', 'Log evening gratitude']
    };
  },

  // RESCUE MY DAY
  rescueMyDay(tasks: TaskItem[]): RescueScheduleResult {
    const uncompleted = tasks.filter(t => t.status !== 'COMPLETED');
    const keep: TaskItem[] = [];
    const move: TaskItem[] = [];
    const optional: TaskItem[] = [];

    uncompleted.forEach(task => {
      if (task.priority === 'MUST_DO' || task.dueDate === new Date().toISOString().split('T')[0] && task.priority === 'HIGH') {
        keep.push(task);
      } else if (task.priority === 'NORMAL' && (task.estimatedMinutes || 30) > 45) {
        move.push(task);
      } else {
        optional.push(task);
      }
    });

    return {
      keep,
      move,
      optional,
      rationale: `You have ${uncompleted.length} unfinished tasks with limited daylight remaining. We've preserved ${keep.length} non-negotiable item(s), gently deferred ${move.length} heavy item(s) to tomorrow, and marked ${optional.length} item(s) as low-stress optional.`
    };
  },

  // PREPARE TOMORROW
  prepareTomorrow(
    user: UserProfile,
    tasks: TaskItem[],
    exams: Exam[]
  ): TomorrowPlanResult {
    const pendingHigh = tasks
      .filter(t => t.status !== 'COMPLETED' && (t.priority === 'HIGH' || t.priority === 'MUST_DO'))
      .map(t => t.title);

    const upcomingExam = exams[0];

    return {
      wakeTarget: user.wakeTargetTime || '07:00 AM',
      morningRoutine: [
        'Drink 500ml water immediately upon waking',
        '10-minute dynamic joint mobility and sunlight exposure',
        'High-protein breakfast to fuel sustained cognitive focus'
      ],
      priorityTasks: pendingHigh.length > 0 ? pendingHigh : ['Complete 45-min Deep Focus Block', 'Log daily check-in'],
      studyPlan: upcomingExam 
        ? `Dedicate 90 minutes to ${upcomingExam.subjectName} (${upcomingExam.topics.slice(0, 2).join(', ')})`
        : '2 hours of deliberate project work',
      restPlan: `Plan bedtime by 10:45 PM to protect your ${user.sleepTargetHours}-hour sleep target.`,
      encouragement: 'Tomorrow is a clean canvas. One consistent block at a time builds mastery.'
    };
  },

  // NATURAL LANGUAGE MEAL STRUCTURING
  parseMealNaturalLanguage(input: string): {
    food: string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    estimatedCalories: number;
    portion: string;
  } {
    const lower = input.toLowerCase();
    let mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' = 'Lunch';
    if (lower.includes('morning') || lower.includes('egg') || lower.includes('toast') || lower.includes('oats') || lower.includes('breakfast')) {
      mealType = 'Breakfast';
    } else if (lower.includes('snack') || lower.includes('tea') || lower.includes('coffee') || lower.includes('fruit')) {
      mealType = 'Snack';
    } else if (lower.includes('dinner') || lower.includes('night') || lower.includes('soup') || lower.includes('curry')) {
      mealType = 'Dinner';
    }

    let estimatedCalories = 450;
    if (lower.includes('salad') || lower.includes('fruit')) estimatedCalories = 220;
    if (lower.includes('protein') || lower.includes('steak') || lower.includes('chicken') || lower.includes('paneer')) estimatedCalories = 580;
    if (lower.includes('dosa') || lower.includes('eggs')) estimatedCalories = 420;

    return {
      food: input.trim(),
      mealType,
      estimatedCalories,
      portion: 'Standard portion'
    };
  },

  // AI SEARCH (Strictly respects user accessibility)
  searchAccessibleData(
    query: string,
    currentUserId: string,
    tasks: TaskItem[],
    subjects: StudySubject[],
    exams: Exam[],
    goals: Goal[]
  ) {
    const q = query.toLowerCase().trim();
    const accessibleTasks = tasks.filter(t => 
      (t.creatorId === currentUserId || t.visibility === 'SHARED') &&
      (t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)))
    );

    const accessibleExams = exams.filter(e => 
      e.userId === currentUserId && 
      (e.subjectName.toLowerCase().includes(q) || e.topics.some(tp => tp.toLowerCase().includes(q)))
    );

    const accessibleGoals = goals.filter(g =>
      (g.creatorId === currentUserId || g.isShared) &&
      (g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q))
    );

    return {
      tasks: accessibleTasks,
      exams: accessibleExams,
      goals: accessibleGoals,
      summary: `Found ${accessibleTasks.length} task(s), ${accessibleExams.length} exam topic(s), and ${accessibleGoals.length} goal(s) matching "${query}".`
    };
  }
};
