---
goal: Phase 2 The Alarms Implementation Plan
version: 1.0
date_created: 2026-04-02
last_updated: 2026-04-02
owner: Daniel Shittu
status: Planned
tags: [feature, phase-2, alarms, notifications, tauri, rust, evals]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan implements Phase 2 (The Alarms): convert agent-generated alarms into reliable macOS native notifications with acknowledgement actions, one-time snooze, escalation, persistence across restarts, and deterministic telemetry for later pattern analysis.

## 1. Requirements & Constraints

- **REQ-001**: Trigger macOS native notifications for every planned alarm persisted in `alarms`.
- **REQ-002**: Use user-language alarm labels from plan output; no generic fallback labels at delivery time.
- **REQ-003**: Support notification actions `I'M ON IT` and `SNOOZE ONCE` and persist action outcome with timestamp.
- **REQ-004**: Enforce escalation: if no acknowledgement within 5 minutes, schedule and deliver Tier 2 alarm.
- **REQ-005**: Enforce snooze policy: exactly one follow-up delivery per alarm when snoozed.
- **REQ-006**: Ensure alarms survive app restart and machine restart using persisted schedule replay plus LaunchAgent bootstrap.
- **REQ-007**: Preserve existing Phase 1 flows (`submitWeeklyIntent`, fallback shift, dashboard completion writes).
- **SEC-001**: Keep all notification scheduling state transitions in Rust commands/services; frontend must not mutate SQLite directly.
- **SEC-002**: Validate all frontend-provided command inputs (alarm IDs, timestamps, action names) before database writes.
- **ARC-001**: Maintain Tauri layering: React UI -> command bridge (`src/lib/commands.ts`) -> Rust commands/services -> SQLite.
- **ARC-002**: Rust command interfaces return `Result<T, String>` and avoid panic paths (`unwrap`, `expect`) in runtime code.
- **CON-001**: Existing schema in `src-tauri/migrations/001_initial_schema.sql` currently lacks escalation/snooze/audit fields; add additive migration only.
- **CON-002**: Keep idle CPU impact below 1% and avoid polling loops without cancellation.
- **CON-003**: Existing `TaskPlan` validation remains source of truth for alarm payload shape before persistence.
- **GUD-001**: Follow Rust testing pyramid: unit tests for scheduling logic, integration tests for DB/commands, end-to-end smoke for delivery flow.
- **GUD-002**: Follow deterministic model output handling guidance: strict schema validation, explicit timeout/retry bounds, and stable thresholds in evals.
- **PAT-001**: Notification delivery pipeline must be idempotent by alarm identity (`alarm_id`, `tier`) to prevent duplicate notifications.
- **PAT-002**: Every state transition (`scheduled -> fired -> acknowledged|snoozed|escalated|missed`) must be persisted and queryable.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Establish alarm data model and command contract for reliable scheduling and state transitions.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Add migration file `src-tauri/migrations/003_phase2_alarms.sql` with additive columns on `alarms`: `tier INTEGER NOT NULL DEFAULT 1`, `fired_at TEXT`, `snoozed_until TEXT`, `snooze_count INTEGER NOT NULL DEFAULT 0`, `escalated_from_alarm_id INTEGER`, `delivery_token TEXT`, `last_action TEXT`; add new table `alarm_events(id, alarm_id, event_type, event_at, metadata_json)`. |  |  |
| TASK-002 | Update Rust alarm payloads in `src-tauri/src/commands/planning.rs` (`AlarmInput`, plan read/write mapping) to include optional `tier` while preserving backward compatibility with Phase 1 plans. |  |  |
| TASK-003 | Create `src/types/alarm.ts` with frontend-safe alarm lifecycle types (`AlarmState`, `AlarmAction`, `AlarmEvent`) and map to command payloads. |  |  |
| TASK-004 | Update `src/lib/commands.ts` with new command constants: `scheduleWeekAlarms`, `reschedulePendingAlarms`, `acknowledgeAlarm`, `snoozeAlarmOnce`, `escalateAlarmIfUnacked`, `getAlarmTimeline`. |  |  |
| TASK-005 | Add command registration placeholders in `src-tauri/src/lib.rs` and `src-tauri/src/commands/mod.rs` for new Phase 2 alarm command module. |  |  |

Phase 1 Exit Criteria:
- Database schema supports one-time snooze, escalation lineage, and immutable event audit.
- Command names and payload contracts are explicitly defined in both TypeScript and Rust.

### Implementation Phase 2

- GOAL-002: Implement Rust alarm engine and macOS notification delivery with deterministic scheduling semantics.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-006 | Create `src-tauri/src/alarm_engine.rs` with `AlarmEngine` service methods: `schedule_week_alarms(week_start)`, `schedule_alarm(alarm_id)`, `fire_alarm(alarm_id, tier)`, `enqueue_escalation(alarm_id)`, `recover_pending_after_restart()`. |  |  |
| TASK-007 | Integrate `tauri-plugin-notification` in `src-tauri/Cargo.toml` and `src-tauri/src/lib.rs`; implement `send_alarm_notification(alarm_id, title, body, actions)` in `src-tauri/src/notifications.rs`. |  |  |
| TASK-008 | Implement state machine transitions in `src-tauri/src/alarm_engine.rs`: `scheduled -> fired`, `fired -> acknowledged`, `fired -> snoozed`, `fired -> escalated`, `fired -> missed`; persist every transition to `alarm_events`. |  |  |
| TASK-009 | Implement action handlers in `src-tauri/src/commands/alarm.rs`: `acknowledge_alarm(alarm_id)`, `snooze_alarm_once(alarm_id)`; enforce `snooze_count <= 1` and return deterministic error if second snooze attempted. |  |  |
| TASK-010 | Implement escalation worker in `src-tauri/src/alarm_engine.rs` to trigger Tier 2 exactly 5 minutes after Tier 1 fire when no acknowledgement exists. |  |  |

Phase 2 Exit Criteria:
- Alarm notifications fire from persisted DB entries with action buttons.
- Escalation and snooze policies are enforced entirely by Rust state machine rules.

### Implementation Phase 3

- GOAL-003: Connect Week Plan generation and app startup flows to alarm scheduling and replay.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-011 | Update `src/store/week.ts` submit success path to call `scheduleWeekAlarms` after `storeTaskPlan`; surface scheduling failures as non-blocking errors with retry action. |  |  |
| TASK-012 | Update `src/components/WeeklyIntent.tsx` and `src/components/Dashboard.tsx` to display alarm scheduling status (`scheduled_count`, `failed_count`, `last_sync_at`) returned from command response. |  |  |
| TASK-013 | Add startup replay in `src-tauri/src/lib.rs` setup hook: call `recover_pending_after_restart()` after DB init. |  |  |
| TASK-014 | Implement LaunchAgent helper in `src-tauri/src/launch_agent.rs` and command `ensure_alarm_launch_agent()` to install/update plist for restart resilience on macOS. |  |  |
| TASK-015 | Add Settings control in `src/components/Settings.tsx` and `src/store/settings.ts` to show alarm daemon status and manual `Resync Alarms` action invoking `reschedulePendingAlarms`. |  |  |

Phase 3 Exit Criteria:
- Generating a week plan schedules alarms automatically.
- App restart and machine restart recover pending alarms without manual intervention.

### Implementation Phase 4

- GOAL-004: Implement acknowledgement telemetry and analytics-ready alarm timelines.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-016 | Extend `src-tauri/src/commands/alarm.rs` with `get_alarm_timeline(week_start)` query joining `alarms` and `alarm_events` for ordered lifecycle output. |  |  |
| TASK-017 | Add `src/types/alarmMetrics.ts` with deterministic metric schema: `ack_latency_seconds`, `escalation_rate`, `snooze_rate`, `miss_rate`, `label_user_language_score`. |  |  |
| TASK-018 | Create `src/llm/evals/alarm_engine_eval.ts` using fixtures to compute reliability metrics for firing, escalation timing, one-snooze enforcement, and acknowledgement logging. |  |  |
| TASK-019 | Add fixture set `src/llm/evals/fixtures/alarm_engine_cases.json` containing at least 20 deterministic scenarios (normal ack, snooze, duplicate action, restart replay, overdue alarm). |  |  |
| TASK-020 | Update `src/llm/evals/README.md` to document eval command contracts, thresholds, and failure interpretation for CI usage. |  |  |

Phase 4 Exit Criteria:
- Alarm lifecycle events are queryable and metrics can be computed deterministically.
- Eval harness fails fast on policy regressions.

### Implementation Phase 5

- GOAL-005: Add comprehensive tests and operational checks for Phase 2 definition of done.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-021 | Add Rust unit tests in `src-tauri/src/alarm_engine.rs` for scheduling calculations, state transitions, idempotency token behavior, and escalation timing math. |  |  |
| TASK-022 | Add Rust integration tests in `src-tauri/tests/alarm_commands.rs` for command success/error paths, transaction rollback, one-snooze enforcement, and restart replay (`OCTOPUS_DB_PATH` isolated temp DB per test). |  |  |
| TASK-023 | Add frontend tests `src/components/__tests__/Dashboard.alarms.test.tsx` and `src/components/__tests__/WeeklyIntent.alarms.test.tsx` for schedule status rendering, retry UX, and fallback visibility coexistence. |  |  |
| TASK-024 | Add command bridge tests `src/lib/__tests__/commands.alarm.test.ts` validating payload naming and command constant integrity. |  |  |
| TASK-025 | Add notification integration smoke script `scripts/smoke/alarms-smoke.ts` that seeds DB alarms, triggers scheduler, and asserts event timeline transitions. |  |  |
| TASK-026 | Update `package.json` scripts: `eval:alarm-engine`, `test:phase2`, and update CI docs in `README.md` with exact run order (`cargo test`, `npm test`, eval scripts). |  |  |

Phase 5 Exit Criteria:
- Automated tests verify Phase 2 policies end-to-end.
- CI-executable scripts exist for tests and evals with deterministic pass/fail thresholds.

## 3. Alternatives

- **ALT-001**: Implement alarm scheduling in frontend timers (`setTimeout`) and deliver notifications from React. Rejected due restart fragility and architecture violations.
- **ALT-002**: Use polling every minute to detect due alarms. Rejected due CPU overhead and non-deterministic drift under sleep/wake transitions.
- **ALT-003**: Allow unlimited snooze. Rejected because roadmap explicitly forbids infinite snooze loops.
- **ALT-004**: Trigger escalation from LLM calls instead of deterministic Rust logic. Rejected because escalation is enforcement logic and must be deterministic/offline-capable.
- **ALT-005**: Introduce full LangGraph orchestration for alarms in Phase 2. Rejected for current scope; Phase 2 requires deterministic local scheduling and does not need graph branching.

## 4. Dependencies

- **DEP-001**: Existing planning persistence in `src-tauri/src/commands/planning.rs` and `src/store/week.ts`.
- **DEP-002**: Existing DB schema and migration chain in `src-tauri/migrations/001_initial_schema.sql` and `src-tauri/migrations/002_phase1_brain.sql`.
- **DEP-003**: Existing Tauri command registration in `src-tauri/src/lib.rs` and command constants in `src/lib/commands.ts`.
- **DEP-004**: Existing eval infrastructure in `src/llm/evals/goal_decomposer_eval.ts` and fixtures directory.
- **DEP-005**: `tauri-plugin-notification` (new Rust and Tauri plugin dependency for native notifications).
- **DEP-006**: macOS LaunchAgent support for restart persistence (plist write permissions and validation).

## 5. Files

- **FILE-001**: `src-tauri/migrations/003_phase2_alarms.sql` — alarm lifecycle and event schema additions.
- **FILE-002**: `src-tauri/src/alarm_engine.rs` — deterministic scheduling, escalation, replay logic.
- **FILE-003**: `src-tauri/src/notifications.rs` — notification payload and action dispatch.
- **FILE-004**: `src-tauri/src/commands/alarm.rs` — Tauri command handlers for alarm operations.
- **FILE-005**: `src-tauri/src/commands/mod.rs` — export alarm command module.
- **FILE-006**: `src-tauri/src/lib.rs` — plugin setup, command registration, startup replay hook.
- **FILE-007**: `src-tauri/src/launch_agent.rs` — LaunchAgent creation/update verification.
- **FILE-008**: `src-tauri/Cargo.toml` — notification plugin and test dev dependencies.
- **FILE-009**: `src/lib/commands.ts` — Phase 2 command constants.
- **FILE-010**: `src/types/alarm.ts` — alarm lifecycle type definitions.
- **FILE-011**: `src/types/alarmMetrics.ts` — eval metric schema definitions.
- **FILE-012**: `src/store/week.ts` — scheduler invocation and status state.
- **FILE-013**: `src/components/WeeklyIntent.tsx` — scheduling status and retry UX.
- **FILE-014**: `src/components/Dashboard.tsx` — alarm status visibility and action confirmation.
- **FILE-015**: `src/components/Settings.tsx` — daemon status and manual resync control.
- **FILE-016**: `src/store/settings.ts` — alarm daemon status state.
- **FILE-017**: `src-tauri/tests/alarm_commands.rs` — integration tests for alarm command and DB behavior.
- **FILE-018**: `src/components/__tests__/WeeklyIntent.alarms.test.tsx` — alarm scheduling UI tests.
- **FILE-019**: `src/components/__tests__/Dashboard.alarms.test.tsx` — alarm lifecycle UI tests.
- **FILE-020**: `src/lib/__tests__/commands.alarm.test.ts` — command mapping tests.
- **FILE-021**: `src/llm/evals/alarm_engine_eval.ts` — deterministic Phase 2 eval runner.
- **FILE-022**: `src/llm/evals/fixtures/alarm_engine_cases.json` — fixed eval scenarios.
- **FILE-023**: `src/llm/evals/README.md` — eval command and threshold docs.
- **FILE-024**: `scripts/smoke/alarms-smoke.ts` — local smoke test script.

## 6. Testing

- **TEST-001**: Rust unit tests for date/time scheduling conversions, timezone-safe due checks, and week replay boundaries.
- **TEST-002**: Rust unit tests for alarm state machine transitions and forbidden transitions (for example `acknowledged -> snoozed` must fail).
- **TEST-003**: Rust integration tests for `schedule_week_alarms`, `acknowledge_alarm`, `snooze_alarm_once`, and `escalate_alarm_if_unacked` commands.
- **TEST-004**: Rust integration tests proving one-time snooze enforcement and no duplicate delivery when command retried.
- **TEST-005**: Rust integration tests proving restart replay schedules pending alarms and does not reschedule acknowledged alarms.
- **TEST-006**: Frontend component tests for alarm schedule status rendering, retry button flow, and fallback-plan coexistence text.
- **TEST-007**: Frontend bridge tests validating command constants and request payload keys for all new alarm commands.
- **TEST-008**: Smoke script test that seeds sample week alarms and verifies expected event sequence in DB.
- **EVAL-001**: Notification Fire Reliability: threshold >= 0.99 (`fired_count / due_count`) on deterministic fixture runs.
- **EVAL-002**: Escalation Timing Accuracy: threshold >= 0.99 within ±10 seconds of 5-minute escalation target.
- **EVAL-003**: One-Snooze Enforcement: threshold = 1.00 (`invalid_second_snooze_blocked / second_snooze_attempts`).
- **EVAL-004**: Ack Logging Completeness: threshold = 1.00 (`ack_events_with_timestamp / ack_actions`).
- **EVAL-005**: Duplicate Delivery Rate: threshold <= 0.001 (`duplicate_delivery_events / total_delivery_events`).
- **EVAL-006**: Label User-Language Coverage: threshold >= 0.95 using lexical overlap heuristic between alarm labels and source weekly goals.
- **EVAL-007**: Restart Recovery Success: threshold = 1.00 for replaying pending alarms after simulated restart.
- **EVAL-008**: CPU Guardrail Check: background scheduler idle CPU < 1% across 60-minute local sample.

## 7. Risks & Assumptions

- **RISK-001**: macOS notification action callback behavior can vary by OS version; mitigation is version-gated integration tests and fallback command path.
- **RISK-002**: Sleep/wake cycles may shift delivery timing; mitigation is due-time reconciliation on wake and deterministic escalation window checks.
- **RISK-003**: LaunchAgent installation can fail due permissions/path issues; mitigation is explicit status UI and manual resync command.
- **RISK-004**: Duplicate scheduling can occur during rapid resync/retry; mitigation is `delivery_token` idempotency guard and unique index.
- **RISK-005**: Schema migration on existing local DB may leave nullable legacy rows; mitigation is additive migration with default values and backfill script.
- **ASSUMPTION-001**: Phase 1 planner continues writing valid alarm day/time/label/type values.
- **ASSUMPTION-002**: Users grant Notifications permission during onboarding or when first prompted by macOS.
- **ASSUMPTION-003**: Existing `week_start` format remains `YYYY-MM-DD` and all alarm date math derives from it.
- **ASSUMPTION-004**: Current Tauri runtime and plugin versions support actionable notifications on macOS target versions.

## 8. Related Specifications / Further Reading

- `docs/05-octopus-build-roadmap.md` (Phase 2 scope and definition of done)
- `docs/03-octopus-agent-design.md` (alarm label language and escalation tiers)
- `docs/02-octopus-architecture.md` (layering and command boundaries)
- `.github/skills/rust-engineer/SKILL.md`
- `.github/skills/rust-engineer/refrences/testing-and-evals.md`
- `.github/skills/langchain-typescript/SKILL.md`
- `.github/skills/langchain-typescript/references/models.md`
