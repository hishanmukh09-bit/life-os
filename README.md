# LIFE OS — Two-Person Life Management Platform

> **"Build better days together."**  
> A private, mutual growth digital life-management platform built strictly for exactly **two people**.

---

## 🌟 Executive Overview

LIFE OS combines daily planning, to-dos, habits, academic study, workouts, mindful nutrition, hydration, sleep, shared goals, memories, life administration, and specialized AI coaching into one unified, private space for two people.

Designed around a human-first, non-surveillance philosophy:
- **No partner rankings or competitive scores**
- **No guilt or shame alerts**
- **Strict, server-isolated privacy** (sensitive records like private journals, menstrual cycles, and health data remain strictly inaccessible to partner queries)
- **Accountability through mutual encouragement and gentle awareness**

---

## 🛠️ Technology Stack

- **Framework:** Next.js 15 (App Router)
- **UI & Interaction:** React 19, Tailwind CSS, Framer Motion, Lucide Icons
- **State & Sync:** React Context & Unified State Engine (supporting local storage, PostgreSQL & SQLite compatibility)
- **Authentication & Authorization:** Secure session tokens, Two-person Space isolation guard (blocks third-party join attempts)
- **AI Suite:** Specialized server-side context engines (What Should I Do Now, Rescue My Day, Prepare Tomorrow, Natural Language Food Logger, and Data-Scoped AI Search) with deterministic offline fallback routines
- **PWA:** Installable web application with manifest and mobile-optimized layouts

---

## 🚀 Key Modules & Capabilities

1. **Home Dashboard:** Dynamic greeting, daily completion gauge, top priorities, habit rings, and the prominent *"What Should I Do Now?"* AI action button.
2. **My Day Timeline:** Morning activation, afternoon execution, evening reconnect, and night wind-down routines.
3. **Task Management & Photo Proof:** Multi-category tasks, recurrence (Daily, Weekdays, Weekends, etc.), and optional photo proof verification with compression and privacy enforcement.
4. **Habit Recovery Architecture:** Current streaks, best streaks, and gentle resilience philosophy: *"One missed day doesn't erase your progress."*
5. **Academic & Focus Hub:** Subject topic mastery breakdown (Euler-Lagrange, Newton-Euler, etc.), Pomodoro Focus Timer (25m, 50m, 90m), Exam countdowns, and Deadline Radar.
6. **Mindful Movement & Food:** Strength/mobility workout logger with sets, reps & weights; natural-language food logger (*"I ate two eggs and avocado toast"* structures estimated calories automatically).
7. **Us & Mutual Support:** Non-surveillance check-ins (*"Looks like today has been busy. Want to send encouragement?"*), *"I Need Help"* beacon, and quick reaction cards.
8. **Memories & Little Things:** Deliberate memory timeline with photos, private journal with per-entry sharing toggles, and partner notes (favorite foods, gift ideas, reminders).
9. **Life Admin & Shared Shopping:** Realtime dual shopping list, recurring bills, renewals, appointments, and searchable Knowledge Vault.
10. **Two-Person Enclosure:** Generates unique 6-character space code (`GROW02`); attempts by a 3rd user to join are blocked at the architecture level.

---

## 💻 Local Development & Testing

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### 2. Installation
```bash
npm install
```

### 3. Running Automated Test Suite
```bash
npm test
```
Verifies two-person space boundaries, privacy isolation filters, AI classification algorithms, and habit recovery math.

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🔒 Security & Privacy Policy

- **Default Private:** Sensitive fields (menstrual cycle, personal reflections, private homework proofs) are private by default.
- **Partner Access:** The other person can only view data explicitly flagged as `SHARED`.
- **Space Boundary:** Exactly two active members are allowed per space. Any join request exceeding two partners returns `SPACE_FULL`.
- **No Stack Traces:** User-facing errors are polite, human, and actionable.

---

## 📄 License
Private & Proprietary — Built with love.
