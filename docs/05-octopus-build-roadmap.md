# OCTOPUS
## Build Roadmap
> Phases · Sprints · Milestones · Definition of Done
> Version 1.0 · March 2026 · Daniel Shittu

---

## 1. Build Philosophy

Octopus is built last phase first in design, first phase first in code. The vision is fully documented before a single line is written. But the code starts with the simplest possible slice that proves the core value: take a goal, produce a plan.

> **BUILD RULE:** Every phase must ship something that works end-to-end before the next phase begins. No partially-built features. No "we'll wire this up later." If it is in the codebase, it works.

### The Non-Negotiable Sequence

```
Document everything first.
Then scaffold.
Then brain.
Then alarms.
Then enforcer.
Then mirror.
Then bridge.
Then harden.
Ship.
```

---

## 2. Phase Overview

| Phase | Name | Duration | Deliverable |
|---|---|---|---|
| 0 | Foundation | 1 week | Tauri + React scaffold, SQLite setup, Claude API wired |
| 1 | The Brain | 2 weeks | Goal intake → Claude decomposition → structured plan displayed |
| 2 | The Alarms | 1 week | Agent-generated alarms firing on macOS with custom labels |
| 3 | The Enforcer | 5 weeks | App blocker, focus mode control, usage tracking — macOS native |
| 4 | The Mirror | 2 weeks | Pattern detection, Sunday review, week-over-week insights |
| 5 | The Bridge | 2 weeks | iPhone sync — alarms, focus modes, Screen Time profile export |
| 6 | Polish & Harden | 3 weeks | Performance, edge cases, onboarding flow, external beta testing |

**Total estimated duration:** 16 weeks from first line of code.

---

## 3. Phase 0 — Foundation

**Duration:** 1 week

### Goal

A working Tauri app with a menu bar icon, SQLite connected, and a multi-provider LLM abstraction layer that can call either Claude or OpenAI. Nothing more. Resist the urge to build features.

### Tasks

1. Initialise Tauri v2 project with React + TypeScript template
2. Configure menu bar mode (tray icon, no dock icon)
3. Set up SQLite with `sqlx` in Rust — create all tables from schema
4. **Create LLM provider abstraction layer:**
   - `provider.ts` — interface definition
   - `claude.ts` — Claude API implementation
   - `openai.ts` — OpenAI API implementation
   - `router.ts` — multi-provider router with fallback chain
5. Build Settings screen for API key configuration (stored in macOS Keychain via Tauri)
6. Build a test screen: text input → LLM API call (user selects provider) → display response
7. Set up Zustand stores with TypeScript interfaces matching all schemas
8. Verify hot reload works between React and Tauri in development

### Commands

```bash
# Initialise project
npm create tauri-app@latest octopus -- --template react-ts
cd octopus

# Add Rust dependencies in src-tauri/Cargo.toml
# sqlx, tokio, serde, objc2, security-framework (for Keychain)

# Add frontend dependencies
npm install zustand @tanstack/react-query zod
```

### Definition of Done

- [ ] App launches as a menu bar icon with no dock icon
- [ ] Clicking icon opens a popup window at 380px × 520px
- [ ] User can configure Claude and/or OpenAI API keys in Settings
- [ ] API keys are stored securely in macOS Keychain (not plaintext)
- [ ] Text entered in test screen can be sent to either Claude or OpenAI (user selects)
- [ ] Both providers return valid responses that are displayed
- [ ] Response is written to SQLite and can be read back on next launch
- [ ] Router implements fallback: if primary provider fails, tries secondary automatically
- [ ] All Zustand stores initialise without errors
- [ ] Hot reload works in development

---

## 4. Phase 1 — The Brain

**Duration:** 2 weeks

### Goal

User types their weekly goals on Sunday. The agent decomposes them into a 7-day plan with time blocks, tasks, and alarm labels. The plan is displayed clearly in the app. This is the core value proposition — if this works well, everything else is implementation.

### Tasks

**Week 1**
1. Build `WeeklyIntent` screen — large text input, identity statement field, submit button
2. Implement `goalDecomposer.ts` with full system prompt from Agent Design Doc
3. Build Zod schema for `TaskPlan` JSON validation
4. Parse and validate Claude's JSON output — handle malformed responses gracefully
5. Store decomposed plan in SQLite (`tasks`, `time_blocks`, `alarms` tables)

**Week 2**
6. Build `Dashboard` screen — show today's tasks in order, current time block
7. Implement task status update (tap to mark done) — write to `completions` table
8. Build `atomicHabits.ts` filter — all four laws as validation functions
9. Wire filter to run on every agent output before database commit
10. Build fallback: if Claude fails, load last week's plan with dates shifted

### Definition of Done

- [ ] User can submit weekly goals in natural language
- [ ] App displays a 7-day breakdown with time blocks and task labels
- [ ] Each task has an implementation intention and a two-minute start
- [ ] Tasks can be marked complete — stored in SQLite with timestamp
- [ ] Atomic Habits filter rejects tasks missing implementation intentions
- [ ] Claude API failure shows a graceful error with fallback to previous plan

---

## 5. Phase 2 — The Alarms

**Duration:** 1 week

### Goal

All alarms generated by the agent fire as macOS native notifications with the correct labels and escalation logic. The user's own words appear in every alarm. This is the first moment the app feels real.

### Tasks

1. Integrate `tauri-plugin-notification` for macOS notifications
2. Build `alarm_engine.rs` — schedule all alarms from the plan at week start
3. Map agent alarm output to notification payloads with custom labels
4. Add notification action buttons: `I'M ON IT` / `SNOOZE ONCE`
5. Implement escalation: if no acknowledgement in 5 min, fire Tier 2 alarm with different label
6. Handle acknowledgement events — write to `alarms` table, update status
7. Test alarm persistence across app restarts (LaunchAgent plist for the alarm daemon)

### Definition of Done

- [ ] All agent-generated alarms fire at the correct times
- [ ] Alarm labels contain the user's own goal language — no generic text
- [ ] Snooze fires exactly one follow-up — no infinite snooze loop
- [ ] Alarms survive a Mac restart (persisted via LaunchAgent)
- [ ] Acknowledgement data is written to SQLite with timestamp

---

## 6. Phase 3 — The Enforcer

**Duration:** 5 weeks

### Goal

This is the hardest phase. Real system-level enforcement. App blocking, focus mode automation, usage tracking. This phase is what separates Octopus from every other productivity app on the market.

### Tasks

**Week 1 — App Blocker Core**
1. Build `app_blocker.rs` — event-driven monitoring via NSWorkspace notification observers
2. Implement real-time app detection using `NSWorkspaceDidActivateApplicationNotification`
3. Build `kill_app(bundle_id)` Tauri command — force-terminate by bundle ID
4. Implement 60-second grace period notification before termination
5. Build intent gate UI — modal overlay when blocked app is detected

**Week 2 — App Blocker Hardening**
6. Add auto-restart detection (if same app relaunches within 10 seconds)
7. Implement continuous enforcement for auto-restarting apps
8. Log all block events to `block_events` table with intent response
9. Add escalating termination: terminate() → forceTerminate() → kill signal
10. Test with common auto-restart apps (Chrome, Slack, Discord)

**Week 3 — Focus Mode + Shortcuts Integration**
11. Build `focus_mode.rs` — Shortcuts CLI bridge to control macOS Focus modes
12. Create onboarding flow for user to create 4 required Shortcuts
13. Implement schedule-driven mode switching via enforcement daemon
14. Add fallback handling if Shortcuts not installed or fail to execute
15. Build mode indicator in menu bar popup — always shows current mode

**Week 4 — Usage Tracking**
16. Build `usage_tracker.rs` — NSWorkspace event-driven logging (not polling)
17. Wire usage data to SQLite `block_events` table for pattern detection
18. Optimize event handling for minimal CPU usage (< 0.1% idle)
19. Test memory stability over 48-hour continuous run
20. Add usage summary queries for Pattern Detector

**Week 5 — Integration + Hardening**
21. Wire enforcement store to all Rust commands via `invoke()`
22. Implement emergency override (3-step confirmation + must type current goal)
23. Permission debugging and error handling (Accessibility, Screen Recording)
24. Test on fresh macOS install (Ventura, Sonoma) with SIP enabled
25. Performance audit: CPU < 1% background, no memory leaks
13. Stress test: run enforcer for 48 hours, confirm no memory leaks or crashes
14. Handle edge case: app on block list is a required tool (user whitelists per block)
15. Build Settings screen — manage block lists, view enforcement log

### Required macOS Permissions

```
Accessibility Access  → required for process monitoring and AppleScript
Screen Recording      → required for NSWorkspace app monitoring (macOS Ventura+)
Full Disk Access      → required for LaunchAgent plist writing  
Notifications         → required for alarm and intervention delivery
```

**Note:** macOS Ventura and later require Screen Recording permission for NSWorkspace to reliably report active applications. This must be requested during onboarding.

### Definition of Done

- [ ] Listed apps terminate within 30 seconds of block period starting
- [ ] Intent gate fires before any blocked app is allowed to open (modal appears)
- [ ] macOS Focus mode changes automatically on schedule without user action
- [ ] Usage data is written to SQLite in real-time (< 1 min lag)
- [ ] Emergency override requires 3 steps and goal text confirmation
- [ ] Enforcer daemon runs at < 1% CPU on idle

---

## 7. Phase 4 — The Mirror

**Duration:** 2 weeks

### Goal

The app now reflects your patterns back at you. After 4 weeks of data, Sunday review generates genuine insights that automatically adjust next week's configuration. This is the moment the app becomes a coach, not just a tool.

### Tasks

**Week 1 — Data Pipeline**
1. Build `patternDetector.ts` — aggregate 4 weeks of SQLite data into analysis payload
2. Define the pattern analysis JSON payload schema (completions, check-ins, block events)
3. Send pattern data to Claude API with Pattern Detector system prompt
4. Parse insights JSON and store in `patterns` table
5. Build `checkin` logging flow — mood ring data written to `checkins` table

**Week 2 — Patterns Screen + Auto-adjustment**
6. Build `Patterns` screen — heatmap view (7 days × 4 weeks), 3 key insights, config preview
7. Implement auto-adjustment: next week's schedule pre-modified based on patterns before intake screen opens
8. Build Sunday review notification — summary pushed at 9am every Sunday automatically
9. Wire pattern insights to display in Sunday review card on Dashboard

### Definition of Done

- [ ] After 4 weeks, Sunday review generates at least 3 actionable insights
- [ ] Insights are in second-person, plain language using the user's own goal words
- [ ] Next week's schedule is pre-adjusted before the user opens the intake screen
- [ ] Patterns screen shows a meaningful visual history without overwhelming
- [ ] Sunday review notification fires automatically at 9am every Sunday

---

## 8. Phase 5 — The Bridge

**Duration:** 2 weeks

### Goal

Octopus extends to the iPhone without building a native iOS app. The Mac agent pushes the schedule to iCloud. The phone enforces it via Apple Shortcuts and Screen Time configuration profiles.

### Tasks

**Week 1 — iCloud Sync**
1. Build `icloud_sync.rs` — write schedule JSON to `~/Library/Mobile Documents/iCloud~Octopus/sync/`
2. Define the sync JSON schema — alarms, focus modes, app limits
3. Build sync trigger: runs every Sunday night after plan is generated
4. Create Apple Shortcuts template for alarm import (`.shortcut` file, user installs once)
5. Create Apple Shortcuts template for Focus mode schedule

**Week 2 — Screen Time + Onboarding**
6. Build MDM configuration profile generator for Screen Time app limits (`.mobileconfig` file)
7. Build iPhone onboarding flow in Settings screen — step-by-step Shortcuts install guide with screenshots
8. Test end-to-end: Mac generates schedule → iCloud sync → iPhone alarms fire within 2 minutes
9. Handle sync failures gracefully — retry on next app launch, surface status in Settings

### Definition of Done

- [ ] Mac alarm schedule appears in iPhone Clock within 2 minutes of generation
- [ ] iOS Focus modes switch on schedule matching the Mac plan
- [ ] Screen Time limits apply to the apps on the block list
- [ ] iPhone sync requires no ongoing maintenance after initial one-time setup
- [ ] Sync status is visible in Settings with last-sync timestamp

---

## 9. Phase 6 — Polish & Harden

**Duration:** 3 weeks

### Goal

The app is functional end-to-end. This phase makes it feel complete: onboarding is smooth, edge cases are handled, performance is solid, and the app has been validated by both the developer and external beta testers.

### Tasks

**Week 1 — Developer Dogfooding**
1. Build full 5-step onboarding flow (identity → permissions → first goal → first block → done)
2. Build permission request screens with plain-language explanations (including Screen Recording)
3. Audit all Claude API failure paths — confirm every failure has a graceful fallback
4. Implement and test offline mode — verify enforcement works without internet
5. Run the app for one full live week — log all friction points, bugs, and rough edges
6. Fix the top 10 issues from the live week

**Week 2 — External Beta Testing**
7. Recruit 3-5 ADHD beta testers from community
8. Audit all Rust command failure paths — confirm enforcer handles permission revocation
9. Test on fresh macOS install (Ventura, Sonoma) with default settings
10. Performance audit: CPU < 1% in background, memory stable over 48 hours
11. Collect beta feedback on onboarding, enforcement tone, and UX friction

**Week 3 — Iteration + Finalize**
12. Address critical beta feedback (blocking issues first)
13. Polish animations, error messages, and edge case handling
14. Write basic README and onboarding documentation
15. Final end-to-end testing on clean system
16. Version 1.0 ready for public release

### Definition of Done

- [ ] Onboarding flow completes in under 5 minutes for a new user
- [ ] All permission requests (including Screen Recording) explain exactly what the permission enables
- [ ] Offline mode tested — enforcement works with no internet connection
- [ ] Offline Sunday intake falls back to last week's plan with manual edit option
- [ ] No uncaught exceptions in any user flow
- [ ] App runs for 7 days without requiring a restart
- [ ] CPU < 1% on idle, < 5% during enforcement active period
- [ ] Daniel has completed one full week using only Octopus
- [ ] 3-5 external beta testers have completed at least 3 days each
- [ ] Critical beta feedback addressed before v1.0

---

## 10. Milestone Summary

| Milestone | Phase | Marker |
|---|---|---|
| M1 — First Plan | Phase 1 | Sunday goal → 7-day plan generated and displayed |
| M2 — First Alarm | Phase 2 | Agent-labelled alarm fires on MacBook at correct time |
| M3 — First Block | Phase 3 | Twitter closes automatically during deep work block |
| M4 — First Insight | Phase 4 | Sunday review surfaces a genuine, personalised pattern |
| M5 — First Sync | Phase 5 | iPhone alarm fires from a Mac-generated schedule |
| M6 — First Week | Phase 6 | Daniel completes one full week using only Octopus |

---

## 11. Tech Debt to Avoid

These are the shortcuts that feel fast now and cost double later. Do not take them.

- **No hardcoded block lists.** Every rule must come from the agent output and be stored in SQLite. No constants files.
- **No skipping the Atomic Habits filter.** Every agent output goes through the filter. Every time. No exceptions for "simple" tasks.
- **No polling loops without cancellation.** Every Rust polling loop must have a clean shutdown path. Orphaned processes will haunt you.
- **No unstructured Claude prompts.** Every prompt must have a defined output schema and a Zod validator. Loose prompts produce unpredictable outputs.
- **No direct SQLite writes from React.** All database writes go through Tauri commands in Rust. The TypeScript layer never touches the database directly.

---

## 12. What Success Looks Like at the End

> Daniel sets his goals on Sunday night. He wakes up Monday and his Mac is already configured. His alarms use his own words. His distractions close themselves. His phone is on the same schedule. By Sunday, he has a report that shows him exactly what happened and why. He didn't need willpower. He needed a better system. That's Octopus.
