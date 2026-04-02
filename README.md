# OCTOPUS
> AI-Powered Productivity Enforcement for ADHD

**Octopus** is not a gentle reminder app. It's an overbearing, opinionated productivity enforcer for macOS, designed specifically for people with ADHD and neurodivergent patterns. It turns your weekly goals into daily non-negotiables, then physically reconfigures your Mac and iPhone environment to make success structurally easier than failure.

---

## The One-Line Pitch

You tell Octopus what you want to achieve this week. It does everything else — builds your schedule, sets your alarms, blocks your distractions, and refuses to let you forget.

---

## Why This Exists

Existing productivity tools assume consistent motivation, reliable check-ins, and linear discipline. ADHD doesn't work that way. Reminder apps get dismissed. Habit trackers create shame spirals. Screen Time limits get bypassed with one tap.

**Octopus is built on Atomic Habits principles:** behavior change isn't about willpower — it's about systems. Octopus *is* the system.

---

## Core Features

### Phase 1 (MVP) — Currently in Development
- **Natural Language Goal Intake** — Type your weekly intentions; AI decomposes them into actionable daily tasks
- **Intelligent Alarm Engine** — Context-aware reminders using your own words (not generic labels)
- **App Blocker** — Schedule-driven enforcement with intent gates (no easy bypasses)
- **Focus Mode Automation** — Automatic macOS Focus mode switching based on your schedule
- **Menu Bar Dashboard** — Always-visible current mode, time remaining, and one-tap session control

### Phase 2 (Planned)
- **Pattern Detection Engine** — AI analyzes 4+ weeks of behavior and auto-adjusts your schedule
- **Habit Replacement System** — Two-minute rule + temptation bundling for sustainable change
- **iPhone Sync Layer** — Extends enforcement to iOS via iCloud + Apple Shortcuts (no native app needed)

### Phase 3 (Future)
- Voice interface for goal intake and accountability check-ins
- Website blocker with intelligent allow-lists
- Adaptive scheduling based on learned peak productivity hours

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Desktop Framework** | Tauri v2 | Native system access, 10x lighter than Electron |
| **UI** | React 18 + TypeScript | Type-safe component architecture |
| **Backend** | Rust | macOS system APIs, process control, memory safety |
| **Database** | SQLite (sqlx) | Local-first, offline-capable, no server needed |
| **State Management** | Zustand | Lightweight, minimal boilerplate |
| **AI** | Multi-provider (Claude/OpenAI) | Provider-agnostic with automatic fallback |
| **Notifications** | tauri-plugin-notification | Native macOS notifications with action buttons |
| **Sync** | iCloud Drive + Apple Shortcuts | No iOS app required for iPhone sync |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│    PRESENTATION LAYER — React + Tauri WebView          │
│    Menu Bar · Dashboard · Weekly Intent · Settings     │
└───────────────────────┬─────────────────────────────────┘
                        │ Tauri invoke()
┌───────────────────────▼─────────────────────────────────┐
│    INTELLIGENCE LAYER — TypeScript + Claude/OpenAI      │
│    Goal Decomposer · Schedule Builder · Pattern        │
│    Detector · Monitoring Agent · Atomic Habits Filter  │
└───────────────────────┬─────────────────────────────────┘
                        │ Tauri commands
┌───────────────────────▼─────────────────────────────────┐
│    ENFORCEMENT LAYER — Rust + macOS APIs                │
│    App Blocker · Focus Manager · Alarm Engine ·        │
│    Usage Tracker · iCloud Sync                         │
└─────────────────────────────────────────────────────────┘
```

**Local-first architecture:** All data stays on your device. AI calls contain only the goal text you provide. API keys stored in macOS Keychain.

---

## Project Structure

```
octopus/
├── docs/                           # Full design documentation
│   ├── 01-octopus-prd.md          # Product vision & features
│   ├── 02-octopus-architecture.md # System design & data flow
│   ├── 03-octopus-agent-design.md # AI prompts & decision logic
│   ├── 04-octopus-design-system.md# ADHD-first UX principles
│   └── 05-octopus-build-roadmap.md# Implementation phases
├── src/                            # React frontend
│   ├── agents/                     # Intelligence layer (Claude/OpenAI)
│   ├── screens/                    # Onboarding, Dashboard, Settings
│   ├── components/                 # Shared UI components
│   ├── stores/                     # Zustand state management
│   └── lib/                        # LLM provider abstraction
└── src-tauri/                      # Rust backend
    ├── src/
    │   ├── commands/               # App blocker, focus mode, alarms
    │   ├── daemon/                 # Background enforcement loop
    │   └── db/                     # SQLite schema & queries
    └── Cargo.toml
```

---

## Development Setup

### Prerequisites
- macOS Ventura (13.0) or later
- Node.js 18+ and npm
- Rust 1.77+
- Claude or OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/octopus.git
cd octopus

# Install frontend dependencies
npm install

# Install Rust dependencies (handled by Tauri)
npm run tauri build --debug

# Run in development mode
npm run tauri dev
```

### Required macOS Permissions
The app will request these during onboarding:
- **Accessibility Access** — For process monitoring and AppleScript execution
- **Screen Recording** — For NSWorkspace app monitoring (macOS Ventura+)
- **Notifications** — For alarms and intervention delivery
- **Full Disk Access** — For LaunchAgent installation

### Validation Commands

Run the full validation pipeline in this order:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
npm test
npm run eval:goal-decomposer
npm run eval:alarm-engine
```

---

## Build Roadmap

| Phase | Status | Milestone |
|-------|--------|-----------|
| **Phase 0: Foundation** | ✅ Complete | Tauri scaffold, SQLite, multi-provider LLM abstraction |
| **Phase 1: The Brain** | 🚧 In Progress | Goal intake → Claude decomposition → structured plan |
| **Phase 2: The Alarms** | 📅 Planned | Agent-generated alarms with custom labels |
| **Phase 3: The Enforcer** | 📅 Planned | App blocker, focus mode automation, usage tracking |
| **Phase 4: The Mirror** | 📅 Planned | Pattern detection & Sunday review insights |
| **Phase 5: The Bridge** | 📅 Planned | iPhone sync via iCloud + Shortcuts |
| **Phase 6: Polish** | 📅 Planned | Onboarding, beta testing, performance hardening |

See [`docs/05-octopus-build-roadmap.md`](docs/05-octopus-build-roadmap.md) for detailed phase breakdown.

---

## Design Philosophy

### Atomic Habits Engine
Every feature is filtered through James Clear's Four Laws:
1. **Make It Obvious** — Implementation intentions, visual cues, wallpaper = current focus
2. **Make It Attractive** — Temptation bundling, pair Spotify with deep work
3. **Make It Easy** — Two-minute rule, one-tap session start
4. **Make It Hard** (for bad habits) — Intent gates, force-close, confirmation dialogs

### ADHD-First UX
- **One primary action per screen** — No decision fatigue
- **Large tap targets (56px minimum)** — Accommodate imprecise taps
- **Dark-first design** — Reduce visual overstimulation
- **No streaks as primary metric** — Shame kills productivity for ADHD brains
- **Time always visible** — Externalizes time awareness (counters time blindness)

See [`docs/04-octopus-design-system.md`](docs/04-octopus-design-system.md) for full design tokens and principles.

---

## Contributing

This is currently a solo project built by [@danielshittu](https://github.com/danielshittu) for personal use. Contributions are not yet accepted while the MVP is being built. Once v1.0 ships, contribution guidelines will be added.

---

## Documentation

Full design docs are in the [`docs/`](docs/) directory:
- **[01 — Product Requirements](docs/01-octopus-prd.md)** — Vision, features, success metrics
- **[02 — Architecture](docs/02-octopus-architecture.md)** — Tech stack, data flow, offline behavior
- **[03 — Agent Design](docs/03-octopus-agent-design.md)** — AI prompts, decision logic, provider configuration
- **[04 — Design System](docs/04-octopus-design-system.md)** — Colors, typography, component library
- **[05 — Build Roadmap](docs/05-octopus-build-roadmap.md)** — Phases, milestones, definition of done

---

## License

[MIT](LICENSE)

---

## Credits

- Built with [Tauri](https://tauri.app/) — Desktop apps using web tech + Rust
- Powered by [Claude](https://anthropic.com/claude) (default) and OpenAI GPT-4o
- Philosophy inspired by [Atomic Habits](https://jamesclear.com/atomic-habits) by James Clear

---

**Remember:** Octopus is not a gentle reminder app. It's an overbearing productivity enforcer. Every feature makes success structurally easier than failure.
