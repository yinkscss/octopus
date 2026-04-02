# OCTOPUS
## System Architecture Document
> Technical Blueprint · Stack · Data Flow · Native Modules
> Version 1.0 · March 2026 · Daniel Shittu

---

## 1. Architecture Overview

Octopus is a Tauri v2 desktop application with a React frontend and a Rust backend core. The Rust layer owns all system-level operations: process management, file system access, notification scheduling, and shell command execution. The React layer owns the UI, agent orchestration, and Claude API communication. All user data is stored locally using SQLite.

> **ARCHITECTURE PRINCIPLE:** The system is divided into three layers: the Enforcement Layer (Rust — interacts with the OS), the Intelligence Layer (TypeScript/Claude — makes decisions), and the Presentation Layer (React — shows state and collects input). These layers communicate through Tauri's command system and never bypass each other.

### 1.1 High-Level System Diagram

```
┌─────────────────────────────────────────────────────────┐
│          PRESENTATION LAYER — React + Tauri WebView      │
│   Menu Bar · Dashboard · Weekly Intent · Patterns ·     │
│   Settings                                              │
└─────────────────────────┬───────────────────────────────┘
                          │ Tauri invoke()
┌─────────────────────────▼───────────────────────────────┐
│         INTELLIGENCE LAYER — TypeScript Agents           │
│   Goal Decomposer · Schedule Builder · Pattern          │
│   Detector · Monitoring Agent                           │
│                                                         │
│   ── Claude API (claude-sonnet-4-20250514) ──           │
└─────────────────────────┬───────────────────────────────┘
                          │ Tauri commands
┌─────────────────────────▼───────────────────────────────┐
│         ENFORCEMENT LAYER — Rust + macOS APIs            │
│   App Blocker · Focus Manager · Alarm Engine ·          │
│   Usage Tracker · iCloud Sync                           │
│                                                         │
│   SQLite · iCloud Drive · Apple Shortcuts ·             │
│   NSWorkspace · LaunchAgent                             │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Desktop Framework | Tauri | v2.x | Native system access via Rust; 10x lighter than Electron; no bundled Chromium |
| UI Framework | React | 18.x | Daniel's existing expertise; Tauri has first-class React support |
| Language (UI) | TypeScript | 5.x | Type safety for agent logic; essential for complex state |
| Language (Backend) | Rust | 1.77+ | macOS system APIs, process control, performance, memory safety |
| Local Database | SQLite via sqlx | 0.7+ | Fast, offline-first, no server, perfect for local behaviour data |
| State Management | Zustand | 4.x | Lightweight, minimal boilerplate, works well with Tauri events |
| AI Layer | Multi-provider (Claude/OpenAI) | Provider-agnostic | Claude Sonnet 4 (default) or OpenAI GPT-4o for goal decomposition; abstraction layer supports multiple providers with fallback chain |
| Notifications | tauri-plugin-notification | 2.x | Native macOS notifications with action buttons |
| iCloud Sync | Native Rust + NSFileManager | — | Direct iCloud Drive access for Shortcuts export and schedule sync |
| Background Tasks | macOS LaunchAgent | — | Runs Rust enforcement daemon independently of UI process |

---

## 3. Directory Structure

```
octopus/
├── src/                              # React frontend
│   ├── agents/                       # Intelligence layer
│   │   ├── goalDecomposer.ts         # Claude: breaks goals into tasks
│   │   ├── scheduleBuilder.ts        # Claude: builds 7-day time blocks
│   │   ├── patternDetector.ts        # Claude: weekly pattern analysis
│   │   ├── monitoringAgent.ts        # Passive: drift detection
│   │   └── atomicHabits.ts           # 4-law filter applied to all decisions
│   ├── screens/
│   │   ├── Onboarding/               # Identity capture, permission grants
│   │   ├── WeeklyIntent/             # Sunday goal intake
│   │   ├── Dashboard/                # Today view (menu bar popup)
│   │   ├── Patterns/                 # 4-week insight view
│   │   └── Settings/                 # App rules, block lists, sync
│   ├── components/                   # Shared UI components
│   ├── store/                        # Zustand state stores
│   ├── lib/
│   │   ├── llm/
│   │   │   ├── provider.ts           # LLM provider interface
│   │   │   ├── claude.ts             # Claude API implementation
│   │   │   ├── openai.ts             # OpenAI API implementation
│   │   │   └── router.ts             # Multi-provider router with fallback
│   │   └── tauri.ts                  # Tauri command bindings
│   └── hooks/                        # Custom React hooks
├── src-tauri/                        # Rust backend
│   ├── src/
│   │   ├── main.rs                   # App entry, tray setup
│   │   ├── commands/                 # Tauri commands (called from TS)
│   │   │   ├── app_blocker.rs        # Kill processes, watch usage
│   │   │   ├── focus_mode.rs         # AppleScript Focus mode bridge
│   │   │   ├── alarm_engine.rs       # Schedule notifications
│   │   │   ├── usage_tracker.rs      # NSWorkspace app events
│   │   │   └── icloud_sync.rs        # Push schedules to iCloud Drive
│   │   ├── daemon/
│   │   │   └── enforcer.rs           # Background enforcement loop
│   │   └── db/
│   │       ├── models.rs             # SQLite schema
│   │       └── queries.rs            # Database operations
│   └── Cargo.toml
├── sync/                             # iPhone sync artefacts
│   ├── shortcuts/                    # Generated Apple Shortcuts JSON
│   └── profiles/                     # MDM config profiles for Screen Time
└── scripts/                          # Dev and build utilities
```

---

## 4. Data Architecture

### 4.1 SQLite Schema

| Table | Purpose | Key Fields |
|---|---|---|
| weekly_goals | Raw goal intake per week | id, week_start, raw_text, identity_statement, created_at |
| tasks | Decomposed daily tasks from agent | id, goal_id, day, title, time_block, duration_min, status |
| time_blocks | Scheduled focus/rest blocks per day | id, week_start, day, start_time, end_time, mode, app_rules |
| alarms | All alarms generated by agent | id, scheduled_at, label, task_id, status, acknowledged_at |
| checkins | Mood/energy quick logs | id, logged_at, energy (1-5), mood (1-5), note |
| block_events | App blocker enforcement log | id, app_name, blocked_at, intent_gate_response, override |
| completions | Task completion records | id, task_id, completed_at, duration_actual, drift_minutes |
| patterns | Weekly pattern analysis output | id, week_start, insights_json, config_adjustments_json |

### 4.2 State Management — Zustand Stores

| Store | Owns |
|---|---|
| useWeekStore | Current week's goals, tasks, time blocks, progress |
| useEnforcementStore | Active app block rules, current mode, override state |
| useCheckinStore | Today's mood/energy log, last 30-day history |
| usePatternStore | Weekly insights, historical completion rates |
| useSettingsStore | App rules, block lists, sync preferences, identity statement |

---

## 5. Enforcement Layer — Rust Commands

### 5.1 App Blocker

The app blocker uses macOS process management APIs via Rust. On a scheduled trigger or a manual lock activation, it monitors running processes against the current block list via NSWorkspace notification observers and terminates any violations. Before termination, a 60-second grace notification is sent.

| Tauri Command | Action |
|---|---|
| `start_block_session(rules)` | Activates block list, begins event-driven monitoring via NSWorkspace observers |
| `check_running_apps()` | Returns list of running apps against current block list |
| `kill_app(bundle_id)` | Force-terminates process by bundle identifier |
| `set_intent_gate(app, response)` | Logs why user is opening a blocked app before allowing |
| `end_block_session()` | Clears block rules, stops monitoring |

### 5.2 Focus Mode Manager

macOS Focus modes are controlled via Shortcuts CLI executed from Rust using `std::process::Command`. The app invokes user-created Shortcuts (e.g., `shortcuts run "Octopus - Deep Work"`) for each Focus mode. The enforcement daemon monitors schedule and calls the appropriate Focus mode automatically. Users create these Shortcuts once during onboarding.

### 5.3 Alarm Engine

Alarms are scheduled as local notifications via `tauri-plugin-notification` with custom action buttons (Acknowledge / Snooze Once). Escalation is handled by scheduling a follow-up notification 5 minutes after the first if no acknowledgement is recorded.

### 5.4 Usage Tracker

NSWorkspace notifications (via Rust objc2 bindings) emit real-time events when apps become active or inactive using `NSWorkspaceDidActivateApplicationNotification` and `NSWorkspaceDidDeactivateApplicationNotification` observers. The usage tracker logs active app, start timestamp, and end timestamp per session with sub-second latency. This feeds directly into the pattern detection agent.

---

## 6. Intelligence Layer — Agent Flow

Full agent design is documented in the Agent Design Document. Summary flow:

1. User submits weekly goals via the WeeklyIntent screen
2. `goalDecomposer.ts` sends prompt to configured LLM provider (Claude or OpenAI) with goals, identity statement, and last week's patterns
3. LLM returns structured JSON: `tasks[]`, `time_blocks[]`, `alarms[]`
4. `scheduleBuilder.ts` validates and stores the plan in SQLite
5. `phoneConfigurator` invokes Rust commands to set alarms and activate block schedule
6. `monitoringAgent` runs on a background timer, polling completion data and drift events
7. Every Sunday, `patternDetector.ts` sends usage history to configured LLM and returns insights JSON
8. Next week's configuration is pre-adjusted based on patterns before user opens the intake screen

---

## 7. iPhone Sync Architecture

### 7.1 What Gets Synced

| Data | Sync Method | Frequency |
|---|---|---|
| Alarm schedule | iCloud Drive JSON → Apple Shortcuts import | Every Sunday night |
| Focus mode schedule | Shortcuts automation → iOS Focus modes | Every Sunday night |
| App block schedule | MDM configuration profile | On schedule change |
| Pattern report summary | Push notification via Shortcuts | Every Sunday morning |

### 7.2 iCloud Bridge

The Rust `icloud_sync` module writes a standardised JSON file to the user's iCloud Drive under `/Octopus/sync/`. An Apple Shortcut on the iPhone watches this file (via automation trigger) and imports the alarm schedule and Focus rules. This requires a one-time Shortcut installation during iPhone onboarding — no iOS app required.

---

## 8. Security & Privacy

- Zero telemetry. No analytics, no crash reporting by default. All data stays on device.
- LLM API calls (Claude or OpenAI) contain no personally identifiable information beyond the goal text the user explicitly provides. API key is stored in macOS Keychain.
- SQLite database stored at `~/Library/Application Support/octopus/` with standard macOS user permissions.
- iCloud sync files are stored in the user's own iCloud Drive — Octopus never has access to an external server.
- The app requires four macOS permissions clearly explained during onboarding:
  - **Accessibility Access** — Required for process monitoring and AppleScript execution
  - **Screen Recording** — Required for NSWorkspace app monitoring on macOS Ventura+
  - **Notifications** — Required for alarm and intervention delivery
  - **Full Disk Access** — Required for LaunchAgent plist writing

---

## 9. Offline Mode Behavior

Octopus is designed as a **local-first application** with intelligent degradation when internet is unavailable.

### 9.1 What Works Offline

| Feature | Offline Capability | Notes |
|---------|-------------------|-------|
| App blocking enforcement | ✅ Fully functional | All block rules stored locally in SQLite |
| Alarm delivery | ✅ Fully functional | Alarms scheduled via macOS native notifications |
| Focus mode automation | ✅ Fully functional | AppleScript commands run locally |
| Usage tracking | ✅ Fully functional | NSWorkspace events captured locally |
| Task completion logging | ✅ Fully functional | All writes go to local SQLite |
| Menu bar dashboard | ✅ Fully functional | Displays current state from local database |

### 9.2 What Requires Internet

| Feature | Offline Behavior | Fallback Strategy |
|---------|-----------------|-------------------|
| Weekly goal decomposition (Claude API) | ❌ Unavailable | Use last week's plan with dates shifted forward + manual edit option |
| Pattern detection (Claude API) | ❌ Unavailable | Skip Sunday review, queue for next online session |
| iPhone sync via iCloud | ⚠️ Delayed | Sync triggers on next online session, queued in background |

### 9.3 Offline Detection & User Communication

- App checks for internet connectivity before calling Claude API
- If offline during Sunday goal intake, user sees: "You're offline. Using last week's plan as a starting point. You can edit tasks manually."
- If offline during Sunday review, user sees: "Pattern analysis requires internet. Your insights will be ready when you're back online."
- Sync status in Settings shows "Waiting for connection" with last successful sync timestamp

### 9.4 Data Integrity

- All local operations (blocking, tracking, logging) continue uninterrupted offline
- No data loss — all events are timestamped and stored locally
- When connection returns, iCloud sync resumes automatically (no user action required)
