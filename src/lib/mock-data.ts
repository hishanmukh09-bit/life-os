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
  PersonalChallenge
} from '@/types';

export const DEMO_SPACE: Space = {
  id: 'space_lifeos_demo',
  name: 'Our Haven',
  inviteCode: 'GROW02',
  ownerId: 'user_alex',
  createdAt: '2026-09-01T08:00:00Z',
  members: [
    {
      userId: 'user_alex',
      name: 'Alex Chen',
      email: 'alex@lifeos.local',
      role: 'OWNER',
      joinedAt: '2026-09-01T08:00:00Z',
      accentColor: 'indigo',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      userId: 'user_maya',
      name: 'Maya Patel',
      email: 'maya@lifeos.local',
      role: 'PARTNER',
      joinedAt: '2026-09-02T10:15:00Z',
      accentColor: 'rose',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    }
  ]
};

export const DEMO_PROFILES: Record<string, UserProfile> = {
  user_alex: {
    id: 'user_alex',
    name: 'Alex Chen',
    email: 'alex@lifeos.local',
    accentColor: 'indigo',
    theme: 'system',
    age: 23,
    fitnessGoal: 'Build functional strength & agility',
    activityLevel: 'Moderately active',
    workoutPreference: 'Strength training & running',
    availableEquipment: 'Dumbbells, pull-up bar, resistance bands',
    workoutDuration: 45,
    preferredWorkoutTime: 'Morning (07:30 AM)',
    sleepTargetHours: 8,
    wakeTargetTime: '06:45',
    waterTargetMl: 2800,
    dietaryPreference: 'non-vegetarian',
    allergies: ['Peanuts'],
    favoriteFoods: ['Salmon poke bowl', 'Avocado sourdough', 'Greek yogurt with berries'],
    collegeOrWork: 'Master in Robotics & Autonomous Systems',
    subjects: ['Robotics Dynamics', 'Computer Vision', 'Control Systems', 'Embedded RTOS'],
    dailyStudyTargetHours: 4,
    preferredPlanningStyle: 'Time-blocked focus blocks'
  },
  user_maya: {
    id: 'user_maya',
    name: 'Maya Patel',
    email: 'maya@lifeos.local',
    accentColor: 'rose',
    theme: 'dark',
    age: 23,
    fitnessGoal: 'Core stability, mobility, and stress reduction',
    activityLevel: 'Active',
    workoutPreference: 'Pilates, yoga & brisk walking',
    availableEquipment: 'Yoga mat, light dumbbells, yoga blocks',
    workoutDuration: 40,
    preferredWorkoutTime: 'Evening (05:30 PM)',
    sleepTargetHours: 8,
    wakeTargetTime: '07:15',
    waterTargetMl: 2500,
    dietaryPreference: 'vegetarian',
    allergies: ['Shellfish'],
    favoriteFoods: ['Paneer tikka wrap', 'Matcha latte', 'Mediterranean quinoa bowl'],
    collegeOrWork: 'Bio-informatics & UI Design Fellow',
    subjects: ['Genomics Data Science', 'Design Systems', 'Machine Learning in Healthcare'],
    dailyStudyTargetHours: 3.5,
    preferredPlanningStyle: 'Flexible milestone-oriented'
  }
};

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task_1',
    spaceId: 'space_lifeos_demo',
    creatorId: 'user_alex',
    assignedToId: 'user_alex',
    title: 'Solve Euler-Lagrange equations for 2-DOF robotic manipulator',
    description: 'Derive inertia matrix and Coriolis vectors for homework submission #4',
    category: 'Study',
    priority: 'MUST_DO',
    visibility: 'PRIVATE',
    status: 'IN_PROGRESS',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '17:00',
    recurrence: 'NONE',
    estimatedMinutes: 50,
    proofRequired: true,
    subtasks: [
      { id: 'sub_1', title: 'Formulate kinetic energy equation T', completed: true },
      { id: 'sub_2', title: 'Derive potential energy V', completed: true },
      { id: 'sub_3', title: 'Compute Christoffel symbols of the first kind', completed: false }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task_2',
    spaceId: 'space_lifeos_demo',
    creatorId: 'user_alex',
    assignedToId: 'user_alex',
    title: 'Upper Body Dumbbell Hypertrophy workout',
    description: 'Bench press, dumbbell rows, overhead press, bicep curls',
    category: 'Fitness',
    priority: 'HIGH',
    visibility: 'SHARED',
    status: 'COMPLETED',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '08:30',
    recurrence: 'NONE',
    estimatedMinutes: 45,
    completedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    proof: {
      id: 'proof_wo',
      taskId: 'task_2',
      imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80',
      uploadedBy: 'Alex',
      timestamp: new Date(Date.now() - 3600000 * 3).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      visibility: 'SHARED'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task_3',
    spaceId: 'space_lifeos_demo',
    creatorId: 'user_maya',
    assignedToId: 'user_maya',
    title: 'Finalize UX wireframes for Bio-Genomics dashboard',
    description: 'Present high-fidelity components to research advisor',
    category: 'Work',
    priority: 'HIGH',
    visibility: 'SHARED',
    status: 'COMPLETED',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '14:00',
    recurrence: 'NONE',
    estimatedMinutes: 90,
    completedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task_4',
    spaceId: 'space_lifeos_demo',
    creatorId: 'user_alex',
    assignedToId: 'user_alex',
    title: 'Hydration Target: 2.8 Liters',
    category: 'Health',
    priority: 'NORMAL',
    visibility: 'SHARED',
    status: 'IN_PROGRESS',
    dueDate: new Date().toISOString().split('T')[0],
    recurrence: 'DAILY',
    estimatedMinutes: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task_5',
    spaceId: 'space_lifeos_demo',
    creatorId: 'user_maya',
    assignedToId: 'user_alex',
    title: 'Pick up organic oat milk and fresh blueberries',
    category: 'Household',
    priority: 'NORMAL',
    visibility: 'SHARED',
    status: 'TODO',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '19:00',
    recurrence: 'NONE',
    estimatedMinutes: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task_6',
    spaceId: 'space_lifeos_demo',
    creatorId: 'user_alex',
    assignedToId: 'user_alex',
    title: 'Review Kalman filter state estimator notes',
    category: 'Study',
    priority: 'NORMAL',
    visibility: 'PRIVATE',
    status: 'TODO',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '21:00',
    recurrence: 'NONE',
    estimatedMinutes: 35,
    dependsOnTaskId: 'task_1', // Dependency!
    isBlocked: true,
    blockerReason: 'Requires completion of Euler-Lagrange equations first',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'proj_robotics_arm',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    title: 'Autonomous Robotic Arm & Vision Sorting',
    description: '3-DOF manipulator with RealSense depth camera tracking and pick-and-place inverse dynamics.',
    deadline: '2026-11-20',
    status: 'ACTIVE',
    progress: 68,
    isShared: true,
    milestones: [
      {
        id: 'ms_1',
        title: 'Mechanical & CAD Modeling',
        completed: true,
        tasks: [
          { id: 't_cad1', title: '3D Joint CAD design in SolidWorks', completed: true },
          { id: 't_cad2', title: 'FEA stress test for base shoulder mount', completed: true }
        ]
      },
      {
        id: 'ms_2',
        title: 'Sensors & Hardware Actuation',
        completed: false,
        tasks: [
          { id: 't_hw1', title: 'Mount BLDC servomotors and encoders', completed: true },
          { id: 't_hw2', title: 'CAN bus communication protocol setup', completed: false }
        ]
      },
      {
        id: 'ms_3',
        title: 'ROS 2 Inverse Kinematics Controller',
        completed: false,
        tasks: [
          { id: 't_sw1', title: 'MoveIt 2 kinematics plugin configuration', completed: false },
          { id: 't_sw2', title: 'YOLOv8 visual object pose estimator', completed: false }
        ]
      }
    ]
  }
];

export const INITIAL_CLASS_SCHEDULE: ClassScheduleItem[] = [
  {
    id: 'cs_1',
    day: 'Monday',
    subjectName: 'Robotics Dynamics & Kinematics',
    room: 'Hall 402',
    startTime: '09:00',
    endTime: '10:30',
    color: '#6366f1'
  },
  {
    id: 'cs_2',
    day: 'Monday',
    subjectName: 'Computer Vision Perception',
    room: 'Lab B',
    startTime: '11:00',
    endTime: '12:30',
    color: '#06b6d4'
  },
  {
    id: 'cs_3',
    day: 'Wednesday',
    subjectName: 'Control Systems & Filtering',
    room: 'Hall 310',
    startTime: '10:00',
    endTime: '11:30',
    color: '#10b981'
  },
  {
    id: 'cs_4',
    day: 'Thursday',
    subjectName: 'Embedded RTOS & Microcontrollers',
    room: 'Hardware Lab 3',
    startTime: '14:00',
    endTime: '16:00',
    color: '#f59e0b'
  }
];

export const INITIAL_SHARED_EXPENSES: SharedExpense[] = [
  {
    id: 'exp_1',
    spaceId: 'space_lifeos_demo',
    title: 'Weekly Organic Grocery Restock',
    amount: 84.50,
    category: 'Food',
    paidByUserId: 'user_maya',
    paidByName: 'Maya',
    splitPercentage: 50,
    isSettled: false,
    date: '2026-10-02'
  },
  {
    id: 'exp_2',
    spaceId: 'space_lifeos_demo',
    title: 'Robotics Lab Microcontroller & Sensor Shield',
    amount: 62.00,
    category: 'Projects',
    paidByUserId: 'user_alex',
    paidByName: 'Alex',
    splitPercentage: 50,
    isSettled: false,
    date: '2026-10-01'
  }
];

export const INITIAL_TRIPS: TripItem[] = [
  {
    id: 'trip_rainier',
    spaceId: 'space_lifeos_demo',
    destination: 'Mount Rainier National Park & Cabin',
    startDate: '2026-10-24',
    endDate: '2026-10-26',
    budget: 450,
    places: ['Skyline Trail', 'Paradise Valley Overlook', 'Longmire General Store'],
    activities: ['Alpine meadow photography', 'Campfire dinner', 'Stargazing'],
    isShared: true,
    packingList: [
      { id: 'pk_1', item: 'Thermal base layers & hiking boots', packed: true, category: 'Clothing' },
      { id: 'pk_2', item: 'Camera body & wide prime lens', packed: true, category: 'Gear' },
      { id: 'pk_3', item: 'Portable water filter & hydration packs', packed: false, category: 'Gear' },
      { id: 'pk_4', item: 'First aid kit & electrolyte tabs', packed: false, category: 'Medical' },
      { id: 'pk_5', item: 'National Park pass & reservation barcode', packed: true, category: 'Documents' }
    ]
  }
];

export const INITIAL_SUBSCRIPTIONS: SubscriptionItem[] = [
  {
    id: 'sub_ieee',
    userId: 'user_alex',
    name: 'IEEE Robotics & Automation Student Society',
    cost: 16.00,
    billingCycle: 'Monthly',
    renewalDate: '2026-10-18',
    category: 'Academics',
    reminderEnabled: true
  },
  {
    id: 'sub_copilot',
    userId: 'user_alex',
    name: 'GitHub Copilot Pro',
    cost: 10.00,
    billingCycle: 'Monthly',
    renewalDate: '2026-10-25',
    category: 'Productivity',
    reminderEnabled: true
  }
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc_passport',
    userId: 'user_alex',
    title: 'International Passport',
    documentType: 'Passport',
    expiryDate: '2029-06-14',
    notes: 'Valid for next 3 years'
  },
  {
    id: 'doc_student_id',
    userId: 'user_alex',
    title: 'University Graduate Student ID',
    documentType: 'College ID',
    expiryDate: '2027-05-30',
    notes: 'Access to engineering robotics machine shop'
  }
];

export const INITIAL_SKILLS: SkillItem[] = [
  {
    id: 'sk_ros',
    userId: 'user_alex',
    name: 'ROS 2 (Robot Operating System)',
    category: 'Engineering',
    currentLevel: 'Intermediate',
    targetLevel: 'Advanced Mastery',
    practiceHours: 48,
    resources: ['MoveIt 2 Tutorials', 'ROS 2 Navigation Nav2 Stack Documentation']
  },
  {
    id: 'sk_cad',
    userId: 'user_alex',
    name: 'Parametric CAD & Simulation',
    category: 'Design',
    currentLevel: 'Proficient',
    targetLevel: 'Expert',
    practiceHours: 35,
    resources: ['SolidWorks CSWP Certification Guide', 'Autodesk Fusion Generative Design']
  }
];

export const INITIAL_READING: ReadingBook[] = [
  {
    id: 'book_1',
    userId: 'user_alex',
    title: 'Modern Robotics: Mechanics, Planning, and Control',
    author: 'Kevin M. Lynch & Frank C. Park',
    totalPages: 544,
    pagesRead: 320,
    status: 'READING',
    notes: 'Chapter 8 on Dynamics provides the cleanest derivation of Newton-Euler recursive algorithm.'
  },
  {
    id: 'book_2',
    userId: 'user_alex',
    title: 'Atomic Habits',
    author: 'James Clear',
    totalPages: 320,
    pagesRead: 320,
    status: 'COMPLETED',
    notes: 'The concept of habit stacking and identity-based habits resonates deeply.'
  }
];

export const INITIAL_CHALLENGES: PersonalChallenge[] = [
  {
    id: 'ch_code',
    userId: 'user_alex',
    title: '30-Day Engineering Code & Derivation Streak',
    targetDays: 30,
    currentDay: 18,
    isShared: true,
    category: 'Study'
  },
  {
    id: 'ch_mobility',
    userId: 'user_alex',
    title: '14-Day Morning Joint Mobility Protocol',
    targetDays: 14,
    currentDay: 9,
    isShared: true,
    category: 'Fitness'
  }
];

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit_1',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    title: 'Drink 500ml water upon waking',
    category: 'Health',
    visibility: 'SHARED',
    currentStreak: 14,
    bestStreak: 28,
    recoveryCount: 1,
    frequency: 'DAILY',
    logs: [
      { date: new Date().toISOString().split('T')[0], completed: true },
      { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], completed: true },
      { date: new Date(Date.now() - 172800000).toISOString().split('T')[0], completed: true }
    ],
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'habit_2',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    title: 'Morning 45-min Deep Focus block',
    category: 'Study',
    visibility: 'SHARED',
    currentStreak: 6,
    bestStreak: 12,
    recoveryCount: 2,
    frequency: 'WEEKDAYS',
    logs: [
      { date: new Date().toISOString().split('T')[0], completed: true },
      { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], completed: true }
    ],
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'habit_3',
    spaceId: 'space_lifeos_demo',
    userId: 'user_maya',
    title: 'Evening 20-min mobility & stretch',
    category: 'Fitness',
    visibility: 'SHARED',
    currentStreak: 9,
    bestStreak: 19,
    recoveryCount: 0,
    frequency: 'DAILY',
    logs: [
      { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], completed: true }
    ],
    createdAt: '2026-09-02T10:00:00Z'
  }
];

export const INITIAL_CHECKINS: DailyCheckin[] = [
  {
    id: 'checkin_alex_today',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    date: new Date().toISOString().split('T')[0],
    mood: 'Good',
    energy: 8,
    stress: 3,
    mainGoal: 'Conquer robotics kinematics proofs and stay fully hydrated',
    notes: 'Woke up feeling refreshed. Great morning workout.',
    photoUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=500&auto=format&fit=crop&q=80',
    visibility: 'SHARED',
    createdAt: new Date().toISOString()
  },
  {
    id: 'checkin_maya_today',
    spaceId: 'space_lifeos_demo',
    userId: 'user_maya',
    date: new Date().toISOString().split('T')[0],
    mood: 'Great',
    energy: 9,
    stress: 4,
    mainGoal: 'Deliver user research synthesis deck',
    notes: 'Excited for our weekend cookout!',
    visibility: 'SHARED',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_STUDY_SUBJECTS: StudySubject[] = [
  {
    id: 'subj_robotics',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    name: 'Robotics Dynamics & Kinematics',
    code: 'ROB-501',
    color: '#6366f1',
    targetHoursWeekly: 10,
    topics: [
      { id: 'top_1', title: 'Euler-Lagrange Formulations', masteryPercentage: 100, isWeakTopic: false },
      { id: 'top_2', title: 'Newton-Euler Recursive Algorithm', masteryPercentage: 100, isWeakTopic: false },
      { id: 'top_3', title: 'Inertia Tensor & Parallel Axis Theorem', masteryPercentage: 65, isWeakTopic: false },
      { id: 'top_4', title: 'Forward & Inverse Dynamics Control', masteryPercentage: 35, isWeakTopic: true },
      { id: 'top_5', title: 'Trajectory Spline Optimization', masteryPercentage: 10, isWeakTopic: true }
    ]
  },
  {
    id: 'subj_vision',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    name: 'Computer Vision & Deep Perception',
    code: 'CS-640',
    color: '#06b6d4',
    targetHoursWeekly: 8,
    topics: [
      { id: 'top_v1', title: 'Epipolar Geometry & Fundamental Matrix', masteryPercentage: 80, isWeakTopic: false },
      { id: 'top_v2', title: 'Feature Detection (SIFT, ORB)', masteryPercentage: 90, isWeakTopic: false },
      { id: 'top_v3', title: '3D Point Cloud Registration (ICP)', masteryPercentage: 50, isWeakTopic: true },
      { id: 'top_v4', title: 'NeRF Neural Radiance Fields', masteryPercentage: 20, isWeakTopic: true }
    ]
  }
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam_robotics_midterm',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    subjectId: 'subj_robotics',
    subjectName: 'Robotics Dynamics & Kinematics',
    date: new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0],
    topics: ['Euler-Lagrange', 'Newton-Euler', 'Inertia Tensors', 'Trajectory Generation'],
    difficulty: 'Hard',
    revisionProgress: 68,
    notes: 'Calculators and 2-page handwritten cheat sheet permitted'
  },
  {
    id: 'exam_vision_quiz',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    subjectId: 'subj_vision',
    subjectName: 'Computer Vision & Deep Perception',
    date: new Date(Date.now() + 86400000 * 19).toISOString().split('T')[0],
    topics: ['Stereo Vision', 'Camera Calibration', 'Optical Flow'],
    difficulty: 'Moderate',
    revisionProgress: 45
  }
];

export const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal_us_1',
    spaceId: 'space_lifeos_demo',
    creatorId: 'user_alex',
    isShared: true,
    category: 'Relationship',
    title: '30-Day Combined Consistency Challenge',
    description: 'Complete at least 50 combined workouts and 25 healthy cooked dinners together',
    targetDate: '2026-11-01',
    progress: 74,
    visibility: 'SHARED',
    milestones: [
      { id: 'm1', title: 'Hit 20 combined workouts', completed: true },
      { id: 'm2', title: 'Cook 10 vegetarian dinners from scratch', completed: true },
      { id: 'm3', title: 'Complete 50 combined workouts', completed: false },
      { id: 'm4', title: 'Host celebration picnic', completed: false }
    ]
  },
  {
    id: 'goal_alex_thesis',
    spaceId: 'space_lifeos_demo',
    creatorId: 'user_alex',
    isShared: false,
    category: 'Academics',
    title: 'Submit Robotic Arm Simulation Paper to IROS',
    targetDate: '2026-11-15',
    progress: 60,
    visibility: 'SHARED',
    milestones: [
      { id: 'm_th1', title: 'Literature review completed', completed: true },
      { id: 'm_th2', title: 'Gazebo simulation validation', completed: true },
      { id: 'm_th3', title: 'Draft paper manuscript', completed: false },
      { id: 'm_th4', title: 'Advisor review & revisions', completed: false }
    ]
  }
];

export const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem_1',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    title: 'Sunset hike at Mount Rainier Skyline Trail',
    date: '2026-08-24',
    category: 'Trip',
    photoUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
    notes: 'The view at the alpine meadow was surreal. We packed homemade sandwiches and watched the golden hour.'
  },
  {
    id: 'mem_2',
    spaceId: 'space_lifeos_demo',
    userId: 'user_maya',
    title: 'Celebrating Alex passing thesis proposal defense',
    date: '2026-09-10',
    category: 'Milestone',
    photoUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80',
    notes: 'Tasting menu downtown with all our favorite dishes. So incredibly proud of this milestone!'
  }
];

export const INITIAL_LITTLE_THINGS: LittleThing[] = [
  {
    id: 'lt_1',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    forPartner: true,
    category: 'Favorite Food',
    title: 'Oat Milk Chai with cardamom and less sugar',
    details: 'She loves the ones from the artisanal cafe on 4th street.'
  },
  {
    id: 'lt_2',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    forPartner: true,
    category: 'Gift Idea',
    title: 'Noise-cancelling wireless headphones (Sage Green)',
    details: 'She mentioned her current ones are wearing out during long study sessions.'
  },
  {
    id: 'lt_3',
    spaceId: 'space_lifeos_demo',
    userId: 'user_maya',
    forPartner: true,
    category: 'Surprise Idea',
    title: 'Weekend getaway cabin with fireplace',
    details: 'Plan after his midterm exam week to completely decompress.'
  }
];

export const INITIAL_SHOPPING: ShoppingItem[] = [
  {
    id: 'shop_1',
    spaceId: 'space_lifeos_demo',
    userId: 'user_maya',
    title: 'Organic cold-pressed olive oil',
    category: 'Pantry',
    completed: true,
    addedByName: 'Maya',
    createdAt: new Date().toISOString()
  },
  {
    id: 'shop_2',
    spaceId: 'space_lifeos_demo',
    userId: 'user_maya',
    title: 'Fresh blueberries & Greek yogurt',
    category: 'Breakfast',
    completed: false,
    addedByName: 'Maya',
    createdAt: new Date().toISOString()
  },
  {
    id: 'shop_3',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    title: 'AA rechargeable batteries for VR controllers',
    category: 'Hardware',
    completed: false,
    addedByName: 'Alex',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_LIFE_ADMIN: LifeAdminItem[] = [
  {
    id: 'la_1',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    title: 'Apartment High-Speed Fiber Internet Bill',
    category: 'Bill',
    dueDate: '2026-10-15',
    amount: 65,
    status: 'PENDING',
    notes: 'Autopay backed up on card ending in 4092'
  },
  {
    id: 'la_2',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    title: 'Car Annual Registration & Emissions Inspection',
    category: 'Renewal',
    dueDate: '2026-10-28',
    amount: 110,
    status: 'PENDING'
  }
];

export const INITIAL_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: 'kn_1',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    title: 'Optimal Spaced Repetition Intervals for Engineering Math',
    category: 'Learning',
    tags: ['Learning', 'Productivity', 'Exams'],
    content: 'Review curve: 1 day, 3 days, 7 days, 16 days, 35 days. Re-derive foundational theorems from first principles without looking at notes.'
  },
  {
    id: 'kn_2',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    title: 'Hydration & Cognitive Endurance Protocol',
    category: 'Article',
    tags: ['Health', 'Focus'],
    content: 'A 2% drop in cellular hydration decreases sustained mental arithmetic and reaction speeds by ~12%. Frontload 1.5L before 1:00 PM.'
  }
];

export const INITIAL_ENCOURAGEMENTS: Encouragement[] = [
  {
    id: 'enc_1',
    spaceId: 'space_lifeos_demo',
    fromUserId: 'user_maya',
    fromUserName: 'Maya',
    toUserId: 'user_alex',
    message: "You've got this! Remember to take a quick walk after your robotics derivations. Proud of your focus today.",
    emoji: '💪',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: true
  }
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'ev_1',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    title: 'Our 2-Year Anniversary Dinner',
    category: 'Anniversary',
    date: '2026-10-24',
    time: '19:30',
    isShared: true,
    notes: 'Table booked by the window overlooking the waterfront.'
  },
  {
    id: 'ev_2',
    spaceId: 'space_lifeos_demo',
    userId: 'user_alex',
    title: 'Robotics Midterm Examination',
    category: 'Exam',
    date: new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0],
    time: '10:00',
    isShared: true
  }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_1',
    title: 'First Step Together',
    description: 'Created your private two-person sanctuary and completed initial setup',
    icon: 'Sparkles',
    unlockedAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'ach_2',
    title: 'Deep Focus Pioneer',
    description: 'Logged more than 20 hours of focused study without interruptions',
    icon: 'GraduationCap',
    unlockedAt: '2026-09-20T17:00:00Z'
  },
  {
    id: 'ach_3',
    title: 'Hydration Masters',
    description: 'Both reached daily hydration goals for 7 consecutive days',
    icon: 'Droplets',
    unlockedAt: '2026-09-28T21:00:00Z'
  },
  {
    id: 'ach_4',
    title: 'Mutual Cheerleaders',
    description: 'Sent 10+ loving encouragements and support check-ins',
    icon: 'HeartHandshake',
    unlockedAt: '2026-10-02T11:00:00Z'
  }
];
