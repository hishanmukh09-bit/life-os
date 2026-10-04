## gstack
Use `/browse` from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/deslop-shared-libs`, `/test-audit`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/scrape`, `/setup-browser-cookies`, `/setup-deploy`, `/setup-gbrain`, `/retro`, `/investigate`, `/document-release`, `/document-generate`, `/codex`, `/cso`, `/autoplan`, `/plan-devex-review`, `/devex-review`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`.

## `/gstack` End-to-End Sprint Execution
When the user types `/gstack <request>` or asks to "run gstack on <request>", automatically run the full 6-phase software factory sprint on that request:

1. **Phase 1: Office Hours & Interrogation (`/office-hours`)**
   - Interrogate the core problem, challenge assumptions, and define the sharpest MVP approach.
2. **Phase 2: Review Pipeline & Architecture (`/autoplan`)**
   - Lock in architectural decisions, UI/UX aesthetics, and test expectations.
3. **Phase 3: Production Implementation**
   - Build the complete solution across relevant files. No placeholders, mock shortcuts, or regressions.
4. **Phase 4: Deep Code Review (`/review`)**
   - Audit code diffs, identify logic bugs and edge cases, and auto-fix findings.
5. **Phase 5: Quality Assurance (`/qa`)**
   - Validate UI flows or APIs using browser/tools, reproduce and resolve edge cases, and ensure stability.
6. **Phase 6: Verification & Ship (`/ship`)**
   - Run tests, audit documentation, and summarize the verified deliverables.
