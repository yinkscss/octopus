---
goal: Phase 1 The Brain Implementation Plan
version: 1.0
date_created: 2026-04-02
last_updated: 2026-04-02
owner: Daniel Shittu
status: Planned
tags: [feature, phase-1, brain, tauri, react, rust, llm]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan implements Phase 1 (The Brain) end-to-end: weekly goal intake, deterministic LLM decomposition into a validated TaskPlan, SQLite persistence through Tauri commands, dashboard rendering for today, completion tracking, Atomic Habits filtering, and fallback to shifted prior-week plans when LLM calls fail.

## 1. Requirements & Constraints

- **REQ-001**: Accept weekly goals as natural language plus identity statement from a dedicated intake UI, then persist the intake payload before decomposition.
- **REQ-002**: Generate and display a 7-day plan containing tasks, time blocks, and alarms.
- **REQ-003**: Enforce implementation intention and two-minute-start fields on every task before commit.
- **REQ-004**: Support task completion updates with timestamped persistence in `completions`.
- **REQ-005**: On planner LLM failure, load prior-week plan shifted to current week and show explicit fallback state in UI.
- **REQ-006**: Preserve provider fallback behavior from `src/llm/router.ts` when primary provider fails.
- **SEC-001**: Do not persist API keys outside Keychain flows already implemented in `src/components/Settings.tsx` and Rust keychain commands.
- **SEC-002**: Keep all database writes in Rust Tauri commands; React/TypeScript must not execute direct SQLite writes.
- **ARC-001**: Maintain architecture layering: Presentation (React) -> Intelligence (TypeScript) -> Enforcement/Data (Rust commands).
- **CON-001**: Keep existing Phase 0 features functional: `src/components/TestScreen.tsx`, `store_llm_response`, and `get_last_llm_response`.
- **CON-002**: Rust command interfaces must return `Result<T, String>` and avoid `unwrap()` in production paths.
- **CON-003**: All planner JSON must be validated via Zod schema before storage.
- **GUD-001**: Use deterministic planner configuration for decomposition calls (temperature `0` for plan generation paths).
- **GUD-002**: All new behavior must be testable via automated unit/integration tests and deterministic eval fixtures.
- **PAT-001**: Follow Rust testing pyramid guidance: unit tests in module, integration tests in `src-tauri/tests/`, plus async tests where applicable.
- **PAT-002**: Follow LangChain structured-output reliability patterns: strict schema validation, explicit retries, bounded timeouts, and deterministic model settings.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Define canonical planning contracts and deterministic decomposition entrypoint in TypeScript.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Create `src/types/taskPlan.ts` with `TaskPlanSchema`, `TaskSchema`, `TimeBlockSchema`, `AlarmSchema`, `TaskTypeSchema`, and `parseTaskPlan(input)` helper that throws typed validation errors. |  |  |
| TASK-002 | Create `src/agents/prompts/goalDecomposer.system.txt` and copy the exact Goal Decomposer system prompt from `docs/03-octopus-agent-design.md` section 3.1. |  |  |
| TASK-003 | Create `src/agents/goalDecomposer.ts` with exported `decomposeWeeklyGoals(input: GoalDecomposerInput): Promise<TaskPlan>`; call existing `LLMRouter.callWithFallback` and validate response via `TaskPlanSchema`. |  |  |
| TASK-004 | Add `src/types/errors.ts` with `PlannerValidationError` and `PlannerProviderError` for deterministic UI/error routing in later phases. |  |  |
| TASK-005 | Add `src/agents/__fixtures__/goal-intake-samples.json` containing at least 5 fixed weekly-goal scenarios for tests and evals. |  |  |

Phase 1 Exit Criteria:
- `decomposeWeeklyGoals` returns only schema-valid `TaskPlan` objects.
- Invalid JSON, schema mismatch, and provider failures map to deterministic typed errors.

### Implementation Phase 2

- GOAL-002: Implement Rust persistence commands for weekly intent, plan storage, reads, fallback shifts, and completion writes.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-006 | Create `src-tauri/src/commands/planning.rs` with commands: `create_weekly_goal(week_start, raw_text, identity_statement)`, `store_task_plan(goal_id, plan_json)`, `get_week_plan(week_start)`, `shift_last_plan_forward(target_week_start)`, `mark_task_completed(task_id, duration_actual, drift_minutes)`; all return `Result<_, String>`. |  |  |
| TASK-007 | Update `src-tauri/src/lib.rs` to `mod commands;` and register all new planning commands in `tauri::generate_handler![]` while preserving existing Phase 0 commands. |  |  |
| TASK-008 | Add `src-tauri/src/commands/mod.rs` exporting `planning` module and explicit function visibility for command registration. |  |  |
| TASK-009 | Refactor `src-tauri/src/db.rs` to support test DB injection via `OCTOPUS_DB_PATH` environment variable (`init_db_with_path(path: &Path)`), with existing default path retained for app runtime. |  |  |
| TASK-010 | Implement transactional writes in `store_task_plan`: write `tasks`, `time_blocks`, and `alarms` atomically; rollback transaction on first failure. |  |  |

Phase 2 Exit Criteria:
- A full `TaskPlan` is committed atomically across all relevant tables.
- Fallback command `shift_last_plan_forward` produces a valid current-week plan when data exists.

### Implementation Phase 3

- GOAL-003: Ship Weekly Intent intake flow and week state management in React/Zustand.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-011 | Create `src/store/week.ts` with `useWeekStore` state/actions: `submitWeeklyIntent`, `loadWeekPlan`, `markTaskComplete`, `isFallbackPlan`, `lastError`, `activeWeekStart`. |  |  |
| TASK-012 | Create `src/components/WeeklyIntent.tsx` with fields `rawGoals` and `identityStatement`, submit handler calling `submitWeeklyIntent`, and deterministic validation messages for empty/invalid input. |  |  |
| TASK-013 | Update `src/App.tsx` tab model from `test|settings` to include `weekly-intent` and `dashboard`; keep `test` tab available during transition. |  |  |
| TASK-014 | Add `src/types/week.ts` for frontend-safe data contracts shared by `WeeklyIntent`, `Dashboard`, and `useWeekStore`. |  |  |
| TASK-015 | Update `src/lib/tauri.ts` call sites used by `useWeekStore` to invoke new Rust planning commands with explicit command-name constants in `src/lib/commands.ts`. |  |  |

Phase 3 Exit Criteria:
- Submitting weekly goals persists intake + generated plan and updates store state in one user flow.
- UI displays deterministic error state for provider, validation, and persistence failures.

### Implementation Phase 4

- GOAL-004: Implement Dashboard rendering, Atomic Habits filter, and fallback orchestration.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-016 | Create `src/components/Dashboard.tsx` rendering current-day tasks sorted by `time_block`, with active block highlight and completion toggles. |  |  |
| TASK-017 | Create `src/agents/atomicHabits.ts` with functions `makeItObvious`, `makeItAttractive`, `makeItEasy`, `makeItHard`, `validateTaskPlan`; enforce required `implementation_intention` and `two_minute_start`. |  |  |
| TASK-018 | Integrate `validateTaskPlan` in `src/agents/goalDecomposer.ts`: run filter before persistence, auto-fix where deterministic, reject otherwise with `PlannerValidationError`. |  |  |
| TASK-019 | Implement LLM failure flow in `useWeekStore.submitWeeklyIntent`: after router/provider failure, call Rust command `shift_last_plan_forward`, set `isFallbackPlan=true`, and display fallback banner in `WeeklyIntent` + `Dashboard`. |  |  |
| TASK-020 | Add completion action wiring in `Dashboard` to call `mark_task_completed`; reflect optimistic status update and rollback on command failure. |  |  |

Phase 4 Exit Criteria:
- Every committed task satisfies Atomic Habits gate requirements.
- LLM outage still yields usable current-week plan via shifted fallback when prior plan exists.

### Implementation Phase 5

- GOAL-005: Add automated tests and deterministic eval harness for planner quality, reliability, and regressions.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-021 | Add frontend test stack: install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `msw`; create `vitest.config.ts` and `src/test/setup.ts`. |  |  |
| TASK-022 | Create `src/agents/__tests__/goalDecomposer.test.ts` covering: valid parse, malformed JSON, schema violation, primary-provider failure + secondary success, both providers fail -> fallback trigger path. |  |  |
| TASK-023 | Create `src/agents/__tests__/atomicHabits.test.ts` covering all 4 laws and auto-fix/reject behavior with fixed fixtures. |  |  |
| TASK-024 | Create `src/components/__tests__/WeeklyIntent.test.tsx` and `src/components/__tests__/Dashboard.test.tsx` covering input validation, submit state, fallback banner, task completion toggles. |  |  |
| TASK-025 | Add Rust unit tests in `src-tauri/src/commands/planning.rs` and integration tests in `src-tauri/tests/planning_commands.rs` for command success/error paths and transaction rollback behavior. |  |  |
| TASK-026 | Create eval harness `src/llm/evals/goal_decomposer_eval.ts` with fixtures under `src/llm/evals/fixtures/`; compute pass rates for schema validity, implementation-intention coverage, two-minute-start coverage, and fallback success. |  |  |
| TASK-027 | Update `package.json` scripts: `test`, `test:watch`, `test:coverage`, `eval:goal-decomposer`; update `src-tauri/Cargo.toml` dev-dependencies as required for Rust tests. |  |  |

Phase 5 Exit Criteria:
- TypeScript and Rust test suites pass in CI-equivalent local runs.
- Eval harness meets defined quality thresholds in Section 6.

## 3. Alternatives

- **ALT-001**: Persist planner output directly from React to SQLite using a JS driver. Rejected because it violates architecture and security constraints requiring Rust-command mediation.
- **ALT-002**: Skip fallback and surface only an error when LLM fails. Rejected because roadmap requires graceful recovery with last-week plan shifting.
- **ALT-003**: Use non-deterministic high-temperature planner settings for creativity. Rejected because weekly schedule generation must be reproducible and schema-stable.
- **ALT-004**: Introduce LangGraph orchestration immediately for Phase 1. Rejected for current scope; Phase 1 requires a single deterministic planner pipeline and can add graph orchestration in later phases if branching complexity grows.

## 4. Dependencies

- **DEP-001**: Existing provider modules in `src/llm/claude.ts`, `src/llm/openai.ts`, `src/llm/router.ts`.
- **DEP-002**: Existing SQLite schema in `src-tauri/migrations/001_initial_schema.sql` containing `weekly_goals`, `tasks`, `time_blocks`, `alarms`, `completions`.
- **DEP-003**: Rust crates already declared in `src-tauri/Cargo.toml`: `sqlx`, `tokio`, `serde`, `serde_json`.
- **DEP-004**: Frontend runtime dependencies in `package.json`: `react`, `zustand`, `zod`.
- **DEP-005**: New test dependencies for frontend (Vitest stack) and Rust dev tooling for integration tests.

## 5. Files

- **FILE-001**: `src/App.tsx` — add WeeklyIntent and Dashboard tab routing while preserving Settings/Test access.
- **FILE-002**: `src/store/week.ts` — week orchestration store and fallback state.
- **FILE-003**: `src/types/taskPlan.ts` — canonical planner schema and parse helper.
- **FILE-004**: `src/types/week.ts` — UI-facing week/task contracts.
- **FILE-005**: `src/types/errors.ts` — typed planner errors.
- **FILE-006**: `src/agents/goalDecomposer.ts` — decomposition and filter orchestration.
- **FILE-007**: `src/agents/atomicHabits.ts` — deterministic four-law filter.
- **FILE-008**: `src/agents/prompts/goalDecomposer.system.txt` — planner prompt source.
- **FILE-009**: `src/components/WeeklyIntent.tsx` — intake screen.
- **FILE-010**: `src/components/Dashboard.tsx` — daily task display and completion actions.
- **FILE-011**: `src/lib/commands.ts` — central command-name constants.
- **FILE-012**: `src-tauri/src/commands/mod.rs` — Rust command module index.
- **FILE-013**: `src-tauri/src/commands/planning.rs` — persistence/read/fallback/completion commands.
- **FILE-014**: `src-tauri/src/db.rs` — db path override for integration tests.
- **FILE-015**: `src-tauri/src/lib.rs` — command registration updates.
- **FILE-016**: `src/agents/__tests__/goalDecomposer.test.ts` — planner pipeline unit tests.
- **FILE-017**: `src/agents/__tests__/atomicHabits.test.ts` — filter rule tests.
- **FILE-018**: `src/components/__tests__/WeeklyIntent.test.tsx` — intake component tests.
- **FILE-019**: `src/components/__tests__/Dashboard.test.tsx` — dashboard component tests.
- **FILE-020**: `src-tauri/tests/planning_commands.rs` — Rust integration tests.
- **FILE-021**: `src/llm/evals/goal_decomposer_eval.ts` — eval runner.
- **FILE-022**: `src/llm/evals/fixtures/*.json` — fixed eval datasets.
- **FILE-023**: `vitest.config.ts` and `src/test/setup.ts` — frontend test harness.
- **FILE-024**: `package.json` and `src-tauri/Cargo.toml` — test/eval scripts and dev dependencies.

## 6. Testing

- **TEST-001**: TypeScript unit tests for planner schema parsing and typed-error mapping (`goalDecomposer.test.ts`).
- **TEST-002**: TypeScript unit tests for Atomic Habits rules (`atomicHabits.test.ts`) with pass/fail and auto-fix cases.
- **TEST-003**: React component tests for intake submission, loading/error states, fallback banner, and completion UX.
- **TEST-004**: Rust unit tests for validation and SQL mapping in `planning.rs`.
- **TEST-005**: Rust integration tests for transactional writes, fallback week shift, and completion insertion (`src-tauri/tests/planning_commands.rs`).
- **TEST-006**: Regression test ensuring Phase 0 commands (`store_llm_response`, `get_last_llm_response`) still pass.
- **EVAL-001**: Schema Validity Rate: run `npm run eval:goal-decomposer`; threshold >= 0.98 valid plans across fixtures.
- **EVAL-002**: Implementation Intention Coverage: threshold = 1.00 (every task includes non-empty `implementation_intention`).
- **EVAL-003**: Two-Minute Start Coverage: threshold = 1.00 (every task includes non-empty `two_minute_start`).
- **EVAL-004**: Provider Fallback Reliability: simulate primary-provider failure in fixtures; threshold >= 0.95 successful fallback completions.
- **EVAL-005**: Rust Transaction Integrity: forced error during `store_task_plan` leaves zero partial row writes across `tasks`, `time_blocks`, `alarms`.
- **EVAL-006**: End-to-End Phase 1 Smoke: intake -> plan generation -> dashboard render -> task completion persists; must pass in local deterministic run.
- **EVAL-007**: Performance Guardrail: single decomposition flow completes under 8 seconds on development hardware with warm network conditions.

## 7. Risks & Assumptions

- **RISK-001**: LLM JSON drift may bypass prompt-level constraints; mitigated with strict Zod validation and typed error handling.
- **RISK-002**: Fallback plan shifting can generate unrealistic timestamps around DST boundaries; mitigated with explicit date/time normalization utilities.
- **RISK-003**: New Rust command set may regress existing command registration; mitigated by regression test for Phase 0 commands.
- **RISK-004**: UI complexity may increase state inconsistency between intake and dashboard; mitigated with single `useWeekStore` source of truth.
- **RISK-005**: Integration tests can become flaky if DB path is not isolated; mitigated by per-test temporary DB files via `OCTOPUS_DB_PATH`.
- **ASSUMPTION-001**: Existing migration schema remains unchanged for Phase 1 and already contains required Phase 1 tables.
- **ASSUMPTION-002**: API keys are preconfigured by user in Settings before first decomposition call.
- **ASSUMPTION-003**: Weekly plan starts on a deterministic date string (`YYYY-MM-DD`) supplied by frontend.
- **ASSUMPTION-004**: Provider modules in `src/llm/claude.ts` and `src/llm/openai.ts` continue to support the existing JSON response workflow.

## 8. Related Specifications / Further Reading

- `docs/05-octopus-build-roadmap.md` (Phase 1 requirements and definition of done)
- `docs/03-octopus-agent-design.md` (Goal Decomposer and Atomic Habits logic)
- `docs/02-octopus-architecture.md` (layer boundaries and data flow)
- `.github/skills/rust-engineer/SKILL.md` and `.github/skills/rust-engineer/refrences/testing-and-evals.md`
- `.github/skills/langchain-typescript/SKILL.md` and `.github/skills/langchain-typescript/references/models.md`
