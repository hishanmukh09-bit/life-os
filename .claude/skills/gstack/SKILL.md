---
name: gstack
description: Executes the complete end-to-end gstack software sprint (office-hours -> autoplan -> build -> review -> qa -> ship) for any task or feature request.
argument-hint: <request or feature description>
---

# /gstack Autonomous End-to-End Sprint

When invoked with a user request, execute the full gstack software factory pipeline sequentially on the user's prompt:

### Phase 1: Problem Interrogation (`/office-hours`)
- Reframe the user's request. Ask the forcing questions: What is the real user pain? What premises are we assuming?
- Define the sharpest wedge to ship and produce a concrete technical direction.

### Phase 2: Plan & Multi-Lens Review (`/autoplan`)
- Review through CEO (problem scope), Design (visual quality & UX), DevEx (ergonomics), and Engineering (architecture, data flow, failure modes).
- Lock in the test matrix and architectural blueprint.

### Phase 3: Production Implementation
- Implement the code cleanly across all required components, libraries, APIs, and styles.
- Preserve existing comments and architecture conventions. No placeholders.

### Phase 4: Code Review (`/review`)
- Inspect the working tree diff.
- Catch race conditions, edge cases, state synchronization errors, and unnecessary complexity.
- Auto-fix any discovered defects.

### Phase 5: Live QA & Verification (`/qa`)
- Test interactive browser flows using `/browse` or verify API endpoints directly.
- Ensure UI renders properly with high visual polish, no console errors, and correct layout reflows.

### Phase 6: Ship & Audit (`/ship`)
- Run project test scripts and verify build passing (`npm run build` or `bun test`).
- Audit docs and summarize all shipped changes with clean commit-ready results.
