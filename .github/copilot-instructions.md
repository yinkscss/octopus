# GitHub Copilot Instructions for Octopus

**Octopus** is an AI-powered productivity enforcement system for macOS. It's designed for people with ADHD and neurodivergent patterns, using AI to turn weekly goals into daily non-negotiable tasks that physically reconfigure the Mac/iPhone environment to make success easier than failure.

## What We're Building

A Tauri v2 desktop app that combines:
- **Natural language goal intake** → AI decomposes weekly goals into daily tasks
- **Intelligent alarm engine** → Context-aware reminders using your own words
- **App blocker** → Schedule-driven enforcement with intent gates
- **Focus mode automation** → Automatic macOS Focus mode switching
- **Pattern detection** → AI analyzes behavior and auto-adjusts schedules
- **iPhone sync** → Extends enforcement to iOS via iCloud + Shortcuts

**Tech Stack:** Tauri v2, React + TypeScript, Rust backend, SQLite (local-first), Claude API (Sonnet 4)

---

## Development Skills (Workflow)

This repository uses specialized gstack skills for development workflows. Skills are invoked with `/skillname` in chat.

| Skill | When to Use | Description |
|-------|-------------|-------------|
| `/autoplan` | Planning phase, before implementation | Auto-review pipeline that reads CEO/design/eng review skills and runs them sequentially. Surfaces critical decisions at approval gates. Use when you want full plan review without answering 15-30 questions. |
| `/careful` | Production changes, destructive operations | Safety guardrails that warn before `rm -rf`, `DROP TABLE`, force-push, `git reset --hard`, etc. User can override warnings. Use when touching prod or shared environments. |
| `/learn` | Understanding patterns, reusing solutions | Manages project learnings across sessions. Review, search, prune, and export what you've learned. Use when wondering "didn't we fix this before?" |
| `/checkpoint` | Context switching, ending sessions | Saves working state (git state, decisions, remaining work) so you can resume exactly where you left off. Use before breaks or switching branches. |
| `/health` | Code quality checks, before commits/PRs | Runs type checker, linter, tests, dead code detector, computes 0-10 quality score. Tracks trends over time. Use for "health check" or "run all checks". |

**Source:** Skills installed from [gstack](https://github.com/username/gstack) development workflow toolkit.

---

## Code Quality Skills (Language/Framework Specific)

Specialized skills for AI development, prompt engineering, and language-specific best practices:

| Skill | Description | Location |
|-------|-------------|----------|
| `prompt-engineering` | Crafting and optimizing prompts for LLMs | [skills/prompt-engineering/SKILL.md](../skills/prompt-engineering/SKILL.md) |
| `rust-blockchain` | Rust development patterns and safety practices | [skills/rust-blockchain/SKILL.md](../skills/rust-blockchain/SKILL.md) |
| `langchain-typescript` | LangChain/LangGraph for agent orchestration (TypeScript) | [skills/langchain-typescript/SKILL.md](../skills/langchain-typescript/SKILL.md) |
| `langchain-python` | LangChain/LangGraph for AI tooling (Python) | [skills/langchain-python/SKILL.md](../skills/langchain-python/SKILL.md) |

**Source:** Skills from [yinkscss/skills](https://github.com/yinkscss/skills).

---

### Basic Usage
```bash
# In GitHub Copilot chat, type:
/autoplan        # Review a plan automatically
/careful         # Enable safety mode
/learn           # Show learnings
/checkpoint      # Save current state
/health          # Run quality checks
```

### When to Invoke

**Use `/autoplan` when:**
- You have a plan.md or design doc ready for review
- You want automated CEO/design/eng review without interactive questions
- You need to validate scope, feasibility, and design decisions

**Use `/careful` when:**
- Making database schema changes
- Running migrations or cleanup scripts
- Working with git force operations
- Touching production configuration

**Use `/learn` when:**
- You solved a tricky bug and want to remember the solution
- You're repeating work from a previous session
- You want to export learnings for documentation

**Use `/checkpoint` when:**
- Ending a coding session
- About to switch branches or context
- Before a long break
- After completing a major milestone

**Use `/health` when:**
- Before committing code
- Before opening a PR
- After refactoring
- When checking overall code quality

## Octopus-Specific Guidelines

### AI Agent Design
- **Prompt structure:** Use XML delimiters (`<role>`, `<context>`, `<task>`) to separate instructions from user data
- **Chain-of-Thought:** Force reasoning inside `<thinking>` tags for complex decisions (goal decomposition, pattern detection)
- **Prevent injection:** Separate user weekly goals from system instructions
- **Hallucination mitigation:** Use RAG with user's historical task data, cite sources

### Rust Backend (Tauri Commands)
- **Error handling:** All Tauri commands return `Result<T, String>`
- **Thread safety:** Use `Arc<Mutex<>>` for shared state accessed by multiple Tauri commands
- **Validation:** Never trust frontend data — validate all inputs
- **Logging:** Use `tracing` crate with structured logs for AI interactions
- **Tests:** Write unit tests for business logic, integration tests for database operations

### TypeScript Frontend (React)
- **State management:** Use Zustand for global state (goals, tasks, settings)
- **API calls:** Wrap all Tauri `invoke()` calls with error boundaries
- **Accessibility:** ADHD-first design — high contrast, clear focus states, keyboard navigation
- **Types:** Strict TypeScript, shared types between frontend/backend via `src-tauri/bindings/`

### SQLite Schema
- **Local-first:** All data stored locally, iCloud sync is append-only
- **Versioning:** Use migrations with `sqlx` or `diesel`
- **Indexes:** Index on `user_id`, `date`, `status` for fast queries
- **Soft deletes:** Mark as `deleted_at` instead of actual deletion for pattern analysis

### Claude API Integration
- **Streaming:** Stream responses for goal decomposition (better UX)
- **Caching:** Use prompt caching for repeated system instructions
- **Fallbacks:** Gracefully degrade if API is unavailable (use cached patterns)
- **Cost control:** Set token limits, log usage per user action

## Development Workflow

1. **Planning:** Use `/autoplan` to review design docs
2. **Implementation:** Follow Tauri best practices, write tests first
3. **Quality Check:** Run `/health` before committing
4. **State Save:** Use `/checkpoint` when switching context
5. **Learn:** Record solutions with `/learn` for future reference
6. **Safety:** Enable `/careful` for migrations or schema changes

## File Structure

```
octopus/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── stores/            # Zustand state
│   └── types/             # Shared TypeScript types
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── commands/      # Tauri commands
│   │   ├── ai/            # Claude API integration
│   │   ├── db/            # SQLite operations
│   │   └── sync/          # iCloud sync logic
│   └── Cargo.toml
├── docs/                  # Full design documentation
└── .github/
    └── skills/            # gstack workflow skills
```

## Testing Standards

- **Rust:** `cargo test` — unit tests for all business logic
- **TypeScript:** Vitest for components, MSW for API mocking
- **E2E:** Playwright for critical user flows (goal intake → alarm creation)
- **AI prompts:** Test with edge cases (ambiguous goals, invalid dates)

## Documentation

Full design docs in `docs/`:
- `01-octopus-prd.md` — Product vision and features
- `02-octopus-architecture.md` — System design and data flow  
- `03-octopus-agent-design.md` — AI prompts and decision logic
- `04-octopus-design-system.md` — ADHD-first UX principles
- `05-octopus-build-roadmap.md` — Implementation phases

---

**Remember:** Octopus is not a gentle reminder app. It's an overbearing productivity enforcer. Every feature should make success structurally easier than failure.
