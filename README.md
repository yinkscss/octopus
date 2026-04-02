# Octopus

**An AI-powered productivity enforcement system for macOS.**

> You tell Octopus what you want to achieve this week. It does everything else — builds your schedule, sets your alarms, blocks your distractions, and refuses to let you forget.

## What Is This?

Octopus is designed specifically for people with ADHD and undiagnosed neurodivergent patterns. It is not a gentle reminder app. It is an overbearing, opinionated agent that takes your weekly goals, dismantles them into daily non-negotiables, and then physically reconfigures your Mac and iPhone environment to make success structurally easier than failure.

The app draws its philosophy from James Clear's *Atomic Habits* — behaviour change is not about motivation or willpower, it is about systems. **Octopus is the system.**

## Core Features

- **Weekly Goal Intake** — Natural language input, AI-powered decomposition into daily tasks
- **Intelligent Alarm Engine** — Alarms labeled with your own words, not generic reminders
- **App Blocker** — Schedule-driven enforcement with intent gates
- **Focus Mode Manager** — Automatic macOS Focus mode switching
- **Pattern Detection** — AI analyzes 4 weeks of behavior and auto-adjusts your schedule
- **iPhone Sync** — Extends enforcement to iOS via iCloud + Apple Shortcuts (no iOS app required)

## Documentation

Full design and implementation documentation is available in the [`docs/`](docs/) directory:

- [Product Requirements](docs/01-octopus-prd.md) — Vision, features, success metrics
- [System Architecture](docs/02-octopus-architecture.md) — Technical blueprint, stack, data flow
- [Agent Design](docs/03-octopus-agent-design.md) — AI brain, prompts, decision logic
- [Design System](docs/04-octopus-design-system.md) — Visual language, UX principles, ADHD-first design
- [Build Roadmap](docs/05-octopus-build-roadmap.md) — Phases, milestones, definition of done

## Technology Stack

- **Desktop Framework:** Tauri v2
- **Frontend:** React + TypeScript
- **Backend:** Rust
- **Database:** SQLite (local-first)
- **AI:** Claude API (Sonnet 4) or OpenAI (GPT-4o) — user configurable
- **Sync:** iCloud Drive + Apple Shortcuts

## Development Workflow

This repository uses GitHub Copilot with specialized skills:

### Workflow Skills (gstack)

| Skill | When to Use |
|-------|-------------|
| `/autoplan` | Auto-review plans (CEO/design/eng review without 15-30 questions) |
| `/careful` | Safety mode for destructive commands (rm -rf, DROP TABLE, force-push) |
| `/learn` | Manage project learnings across sessions |
| `/checkpoint` | Save/resume working state when switching context |
| `/health` | Code quality dashboard (type check, lint, test, quality score) |

### Language/Framework Skills

| Skill | Description |
|-------|-------------|
| [prompt-engineering](skills/prompt-engineering/SKILL.md) | Crafting and optimizing prompts for AI agents |
| [rust-blockchain](skills/rust-blockchain/SKILL.md) | Rust development patterns and safety practices |
| [langchain-typescript](skills/langchain-typescript/SKILL.md) | LangChain/LangGraph for agent orchestration |
| [langchain-python](skills/langchain-python/SKILL.md) | Python-based AI tooling |

Invoke workflow skills in GitHub Copilot chat with `/skillname`. Full documentation in [`.github/copilot-instructions.md`](.github/copilot-instructions.md).

## Status

**In Design Phase** — Full documentation complete, implementation roadmap defined. Ready for Phase 0 (Foundation).

## License

See [LICENSE](LICENSE) for details.
