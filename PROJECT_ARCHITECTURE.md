# LIFE OS — System Architecture & Technical Specifications

> **Tagline:** *"Build better days together."*  
> **Product Nature:** A private, high-trust, mutual growth and digital life-management platform designed strictly for exactly **two users**.

---

## 1. System Architecture Overview

LIFE OS is engineered as a modern, high-performance, full-stack progressive web application (PWA) built with **Next.js (App Router)**, **React**, **TypeScript**, and **Tailwind CSS**.

### Key Architectural Tenets:
1. **Two-Person Boundary (Space Enclosure):** Every core entity is scoped to a unique `SpaceId`. The database and server layers reject any attempt to add a third user.
2. **Strict Privacy Isolation:** Records default to `PRIVATE` unless explicitly flagged as `SHARED`. Sensitive domains (cycle tracking, personal reflections, private weight logs) are cryptographically or logically isolated so partner queries cannot read them.
3. **No-Surveillance Human Philosophy:** Designed for encouragement, mutual awareness, and personal consistency—devoid of partner leaderboards, guilt alerts, or invasive tracking.
4. **Resilient Local & Edge AI Engine:** Server-side LLM routines with deterministic rule-based fallbacks for offline/unconfigured environments, ensuring features like *What Should I Do Now?*, *Rescue My Day*, and *Prepare Tomorrow* always function seamlessly.

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer (PWA)                     │
│  Next.js 15 App Router | React 19 / Tailwind / Framer Motion│
│  Zustand / SWR Cache | Service Worker (Offline Support)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON / Server Actions
┌──────────────────────────────▼──────────────────────────────┐
│                    Application / API Layer                  │
│  - Session & Auth Guards (JWT / Secure HttpOnly Cookies)    │
│  - Space Enclosure Middleware (Max 2 Members per Space)     │
│  - Privacy Scoping Engine (PRIVATE vs SHARED Filter)        │
│  - Specialized AI Services (Coach, Rescue, Planner)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼────────────────────────┐
       ▼                       ▼                        ▼
┌──────────────┐      ┌─────────────────┐      ┌──────────────────┐
│  PostgreSQL  │      │ Private Storage │      │ AI Engine (LLM)  │
│  (Prisma ORM)│      │  (Blob/Local/S3)│      │ (OpenAI/Fallback)│
└──────────────┘      └─────────────────┘      └──────────────────┘
```

---

## 2. Database Architecture (Prisma Schema Overview)

The database schema is fully normalized and organized around relational integrity:

1. **User & Authentication:**
   - `User`: Basic credentials, email, password hash, status.
   - `Profile`: Display name, avatar, bio, wellness preferences, study/work schedules, theme & accent preferences.
   - `Session`: Token, expiration, device metadata.

2. **Private Space & Membership:**
   - `Space`: Unique ID, join code, owner ID, created timestamp.
   - `SpaceMember`: Relates `User` to `Space`, role (`OWNER`, `PARTNER`), joined timestamp.
   - *Constraint:* Unique index preventing more than 2 active members per space.

3. **Core Life Tracking Modules:**
   - `Task`: Title, category, priority (`LOW`, `NORMAL`, `HIGH`, `MUST_DO`), status, recurrence, due date, estimated duration, visibility (`PRIVATE`, `SHARED`), assigned to user, proof required flag.
   - `TaskProof`: Compressed image path, timestamp, verified flag.
   - `Habit`: Title, frequency, streak count, recovery tracking, visibility.
   - `HabitLog`: Date, completed status, notes.
   - `WaterLog`: Daily intake amount (mL), target, timestamps.
   - `SleepLog`: Bedtime, wake time, duration, quality score, visibility.
   - `Workout`: Type, duration, exercises (JSON/relational sets/reps), intensity, notes, visibility.
   - `Meal`: Meal type (`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`), description, photo URL, estimated macros, visibility.
   - `DailyCheckin`: Mood, energy (1-10), stress (1-10), main priority, visibility.
   - `CycleLog`: Period start/end, symptoms, mood, visibility (Strictly `PRIVATE` by default).

4. **Student & Productivity:**
   - `StudySubject`: Subject name, color, target hours.
   - `StudyTopic`: Topic hierarchy and revision mastery percentage.
   - `Exam`: Subject, date, target score, revision countdown.
   - `StudySession`: Duration in minutes, subject ID, focus timer mode, notes.

5. **Shared Connection & Life Admin:**
   - `Goal`: Personal or Shared (`US_GOAL`), target date, milestones, progress percentage.
   - `Encouragement`: Quick reactions ("You've got this", "Need a break?", custom messages).
   - `HelpRequest`: Category (`Study`, `Workout`, `Overwhelmed`, etc.), urgent flag, resolved flag.
   - `JournalEntry`: Text, mood, photos, lessons, gratitude, visibility.
   - `Memory`: Photo, event date, story, category.
   - `LittleThing`: Favorite things, gift ideas, partner reminders.
   - `Event`: Birthdays, anniversaries, countdowns.
   - `ShoppingItem`: Title, category, checked status, added by user.
   - `LifeAdminItem`: Bills, renewals, appointments, deadlines.
   - `KnowledgeItem`: Notes, learnings, bookmarks, tags.

---

## 3. Authentication & Authorization Architecture

- **Session Management:** Secure HttpOnly, SameSite cookie containing signed session tokens.
- **Access Flow:**
  1. User registers or logs in.
  2. Space state is verified:
     - User has no space: Prompt to either "Create Private Space" (generates an invite code) or "Join Partner's Space" (enters 6-character code).
     - User has space: Verify active membership.
  3. All API routes and Server Actions enforce `requireUser()` and `requireSpaceMember()`.
  4. Authorization layer evaluates query records:
     - Records where `userId == currentUserId` are accessible.
     - Records where `userId != currentUserId` are ONLY accessible if `visibility == 'SHARED'`.

---

## 4. Privacy Model

| Entity | Default Visibility | Sharing Options | Partner Access Policy |
| :--- | :--- | :--- | :--- |
| **Menstrual Cycle** | `PRIVATE` | Explicit opt-in only | Never visible to partner unless explicitly toggled |
| **Personal Journal** | `PRIVATE` | Per-entry share toggle | Strictly hidden by default |
| **Weight & Health** | `PRIVATE` | Optional share | Partner only sees aggregate streaks or shared badges |
| **Tasks** | User Choice | `PRIVATE` or `SHARED` | Shared tasks appear on both dashboards with partner badge |
| **Habits** | User Choice | `PRIVATE` or `SHARED` | Shared habits show mutual consistency rings |
| **Us Goals** | `SHARED` | Always Shared | Joint contribution bar without competitive ranking |
| **Shopping & Admin** | `SHARED` | Always Shared | Real-time dual updates |

---

## 5. AI Architecture

Instead of an unfocused chat interface, LIFE OS implements **12 Context-Grounded AI Engines**:

1. **Daily Planner & Next Action:** Analyzes calendar, remaining tasks, current energy level, and estimated duration to formulate: *"What should I do right now?"*.
2. **Rescue My Day:** Automatically categorizes uncompleted items into `KEEP`, `MOVE`, `OPTIONAL` with one-tap rescheduling upon confirmation.
3. **Prepare Tomorrow:** Nightly briefing synthesizing unfinished tasks, pending deadlines, and morning habits.
4. **Study & Revision Planner:** Calculates Spaced Repetition intervals and revision timelines for exams.
5. **Personalized Workout Assistant:** Generates custom routines matching available equipment and target energy.
6. **Smart Meal Breakdown:** Converts natural language meal descriptions (e.g. *"2 eggs and whole wheat toast"*) into structured macro estimates.
7. **Weekly & Monthly Review:** Computes historical trends (consistency, study time, habit completion) without moralistic judgments.
8. **AI Search & Knowledge Retrieval:** Answers direct natural-language queries against accessible user data.

---

## 6. Storage & Asset Architecture

- **Local / S3 / Supabase Compatible:** Private blob storage pathing with hashed filenames.
- **Validation:** Strict MIME-type checking (JPEG, PNG, WebP), 5MB size ceiling, image dimension optimization.
- **Security:** Images are served through an authenticated proxy endpoint (`/api/media/[id]`) that checks user and space permissions before streaming bytes.

---

## 7. Notification Architecture

- **Context-Aware Alert Engine:**
  - Tasks due within 1 hour.
  - Quiet Hours filter (e.g. 10:00 PM – 7:00 AM) to preserve sleep hygiene.
  - In-app toast alerts, notification tray counter, and Web Push Service Worker hooks.
  - Non-intrusive encouragement alerts ("Your partner sent encouragement ❤️").

---

## 8. Deployment & Production Architecture

- **Deployment Target:** Vercel / Node.js container with standalone output.
- **Database:** PostgreSQL (with Prisma client and connection pooling). SQLite local fallback for zero-dependency instantaneous testing.
- **Environment Variables:** Documented in `.env.example`.
- **PWA Manifest:** Configured with icons, theme colors, and offline fallback caching.

---

## 9. Implementation Phases

- **Phase 1: Foundation & Project Scaffolding** (Next.js 15, Tailwind CSS, Lucide Icons, UI components)
- **Phase 2: Database Schema & Authentication** (Prisma ORM, SQLite/Postgres dual support, Auth session handlers)
- **Phase 3: Space Enclosure & Partner Invitation Flow** (Space creation, 6-character code, join verification, lock-out at 2)
- **Phase 4: Design System & Shell Navigation** (Desktop Sidebar, Mobile Bottom Bar, Theme / Accent Switcher)
- **Phase 5: Home Dashboard & My Day Timeline** (Greetings, progress rings, Today's priorities, Next Action)
- **Phase 6: Task Management & Photo Proof** (Recurring tasks, categories, proof upload, filterable lists)
- **Phase 7: Habits & Recovery Engine** (Streaks, gentle recovery message, consistency charts)
- **Phase 8: Wellness (Sleep, Water, Check-in, Cycle Tracking)** (Quick logging, hydration counters, private cycle calendar)
- **Phase 9: Food & Workout Trackers** (Meal logger, exercise sets/reps, natural language meal input)
- **Phase 10: Student Productivity (Study Dashboard, Focus Timer, Exam Radar)** (Pomodoro timer, topic progress, Spaced Revision)
- **Phase 11: Goals (Personal & US Goals) & Progress Analytics** (Recharts progress trends, milestones)
- **Phase 12: Mutual Support (Check on Them, I Need Help, Encouragement)** (Non-surveillance accountability)
- **Phase 13: Shared Life (Journal, Memories, Little Things, Shopping, Life Admin)** (Interactive shared space)
- **Phase 14: Specialized AI Engines** (What Should I Do Now, Rescue My Day, Prepare Tomorrow, AI Search)
- **Phase 15: Public Landing Page & PWA Manifest** (SEO, meta tags, install prompt, offline service worker)
- **Phase 16: Verification, Automated Testing & Final Polish** (Playwright/Browser verification, demo seeders, production build)
