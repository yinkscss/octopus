# OCTOPUS
## Product Requirements Document
> Vision · Goals · Features · Constraints · Success Metrics
> Version 1.0 · March 2026 · Daniel Shittu

---

## 1. Executive Summary

Octopus is an AI-powered productivity enforcement system for macOS, designed specifically for people with ADHD and undiagnosed neurodivergent patterns. It is not a gentle reminder app. It is an overbearing, opinionated agent that takes your weekly goals, dismantles them into daily non-negotiables, and then physically reconfigures your Mac and iPhone environment to make success structurally easier than failure.

The app draws its philosophy from James Clear's Atomic Habits — behaviour change is not about motivation or willpower, it is about systems. Octopus is the system.

> **THE ONE-LINE PITCH:** You tell Octopus what you want to achieve this week. It does everything else — builds your schedule, sets your alarms, blocks your distractions, and refuses to let you forget.

---

## 2. Problem Statement

### 2.1 The Core Problem

Existing productivity tools are built for neurotypical brains. They assume consistent motivation, reliable check-ins, and linear discipline. ADHD does not work this way. A person with ADHD may hyperfocus intensely for three days, then completely disengage for a week. Reminder apps get ignored. Habit trackers create shame spirals. Streaks punish the human instead of adapting to them.

### 2.2 What Fails Today

| Tool | What It Does | Why It Fails for ADHD |
|---|---|---|
| Apple Reminders | Sends notifications | Dismissed in 2 seconds, forgotten immediately |
| Notion | Organises information | Requires consistent effort to maintain; becomes a graveyard |
| Screen Time (iOS) | Limits apps passively | One-tap override destroys the entire point |
| Habitica | Gamifies habits | Motivation-dependent; crashes when dopamine runs low |
| Focus modes | DND scheduling | Manual to activate; no intelligence behind the rules |
| Any streak app | Tracks consistency | Missing one day triggers shame → full abandonment |

### 2.3 The ADHD-Specific Gap

- Decision fatigue hits before any productive work begins
- Dopamine-seeking behaviour migrates to phones, YouTube, Twitter automatically
- Time blindness — ADHD brains cannot feel time passing, only react to it
- Intention-action gap — goal is set, execution never begins
- Punishment-based systems accelerate avoidance, not compliance

---

## 3. Target User

### 3.1 Primary Persona — Daniel (Builder v1.0)

> **PRIMARY USER:** Full-stack AI engineer. ADHD. Solo founder. Radio host. High ambition, multiple simultaneous projects, chronic procrastination, pattern of hyperfocus followed by drift. Spends most productive hours on MacBook. iPhone is the primary distraction vector.

### 3.2 Expanded Target Audience

| Segment | Profile | Core Need |
|---|---|---|
| ADHD-diagnosed adults | Medicated or unmedicated, aware of patterns | System that fights their own brain on their behalf |
| Undiagnosed neurodivergent | Suspects ADHD/ASD, never formally assessed | Structure without requiring self-diagnosis |
| High-performer burnout | Driven but chronically overwhelmed | Reduce decision fatigue, automate discipline |
| Builders & founders | Solo or small team, no external accountability | External enforcement when internal fails |

### 3.3 Who This Is NOT For

- People who want gentle nudges and positive reinforcement only
- Users uncomfortable with aggressive system-level phone control
- Teams or enterprise use cases (v1.0 is personal, single-user)

---

## 4. Product Philosophy

### 4.1 Atomic Habits Framework — The Four Laws Applied

| Law | Original Principle | Octopus Implementation |
|---|---|---|
| Make It Obvious | Design your environment with cues for good habits | Wallpaper = current focus block. Menu bar = one active task. Agent surfaces your own words back at you. |
| Make It Attractive | Pair habits you need with things you want (temptation bundling) | Agent pairs Spotify access with starting a deep work session. Good behaviour unlocks app access. |
| Make It Easy | Reduce friction to near zero for desired behaviour | One-tap session start. App pre-loads your current task. Two-minute rule applied automatically to new habits. |
| Make It Hard | Add friction to bad habits (inversion of Law 3) | Distraction apps require intent gates. Force close on schedule. Confirmation dialogs. Usage shame receipts. |

### 4.2 Identity-First Design

Atomic Habits teaches that lasting change comes from identity, not goals. You do not want to read more — you want to be a reader. Octopus anchors every weekly configuration to an identity statement set during onboarding. All agent decisions are filtered through: "Does this help Daniel become the person he said he wants to be?"

### 4.3 The Forgiveness Principle

Missing a day does not reset progress. The app logs the gap, notes it, looks for patterns, and moves on. Shame is a productivity killer for ADHD brains. Octopus acknowledges drift without punishing it — then immediately reconfigures to get back on track.

---

## 5. Feature Requirements

### 5.1 Core Features — Phase 1 (MVP)

#### 5.1.1 Weekly Goal Intake
- Natural language input: user types or speaks their weekly intentions
- Agent decomposes goals into daily tasks with time estimates
- Identity statement captured: "This week I am becoming..."
- Output: structured 7-day plan with time blocks assigned

#### 5.1.2 Intelligent Alarm Engine
- Multiple staggered alarms per day — not just wake-up, but transition alarms
- Alarm labels generated by agent from user's own goals (e.g. "You said you'd finish the LangGraph refactor today")
- Alarm escalation — snooze once, second alarm is louder with a different message
- No generic labels. Every alarm is personalised.

#### 5.1.3 App Blocker — macOS
- Schedule-driven app blocking (deep work: block everything except listed tools)
- Intent gate: before opening blocked app, user must answer why, right now
- Force-close apps that exceed time limit
- Grace period: 60-second warning before enforcement kicks in

#### 5.1.4 Focus Mode Manager
- Agent triggers macOS Focus modes automatically on schedule
- Deep Work mode: all notifications silenced, only task tools available
- Recovery mode: relaxed rules, some apps accessible
- Wind-down mode: social apps off, sleep prep begins

#### 5.1.5 Menu Bar Dashboard
- Always-visible current mode and time remaining in block
- One-tap session start / pause / extend
- Current task surface — one sentence, no list
- Quick mood check-in (three taps, no typing)

### 5.2 Phase 2 Features

#### 5.2.1 Pattern Detection Engine
- Logs completion rate per time block over 4+ weeks
- Detects correlations: "You always drift on days you skip breakfast"
- Surfaces insights in Sunday review — plain language, no charts overload
- Next week's config is automatically adjusted based on patterns

#### 5.2.2 Habit Replacement System
- User defines bad habit + desired replacement
- Agent applies Two-Minute Rule: reduces replacement to smallest possible start
- Streak tracking with forgiveness — gap noted, not punished
- Temptation bundling: unlock desired activity only after replacement habit logged

#### 5.2.3 iPhone Sync Layer
- Agent pushes alarm schedule to iPhone via iCloud / Apple Shortcuts
- Focus mode schedule synced to iOS Focus modes
- Screen Time config profile generated for app limits on iPhone
- Sunday pattern report delivered as push notification summary

### 5.3 Phase 3 Features
- Voice interface — dictate goals, get verbal accountability check-ins
- Accountability partner feature — app notifies a chosen contact if goals are missed
- Website blocker with intelligent allow-list (research mode vs distraction mode)
- AI-generated wallpaper based on current week's identity statement
- Adaptive scheduling — agent learns your peak hours and auto-assigns deep work

---

## 6. Non-Functional Requirements

| Requirement | Target | Rationale |
|---|---|---|
| Privacy | All data local-first | Health and behaviour data is sensitive; no cloud storage of personal patterns |
| Latency | Agent response < 3 seconds | ADHD attention span cannot wait for slow responses |
| Reliability | App blocker 99.9% uptime | One failure trains the brain that it can be bypassed |
| Offline capability | Core functions work offline | No dependency on internet for enforcement |
| macOS version | Ventura 13+ required | Accessibility and Focus APIs require modern macOS |
| Performance | < 1% CPU in background | Menu bar app cannot drain battery or slow the machine |

---

## 7. Constraints & Risks

### 7.1 Technical Constraints
- macOS sandbox limits access to some system APIs — requires user to grant Accessibility permissions manually during onboarding
- iOS app blocking is not possible without MDM profile installation — requires user trust in the configuration profile
- Apple Shortcuts automation has timing limitations on iOS — precise alarm scheduling requires workarounds

### 7.2 User Experience Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| User disables app when frustrated | High | Make disabling deliberately difficult. Require typing goal to confirm disable. |
| Overbearing enforcement causes anxiety | Medium | Forgiveness principle. Drift logged, not punished. Tone is firm but never shaming. |
| Alarm fatigue — too many notifications | Medium | Maximum 6 alarms per day. Quality over quantity. Labels must be meaningful. |
| App blocking prevents legitimate urgent use | Low | Emergency override available with 3-step confirmation and logged reason. |
| Claude API latency during goal decomposition | Low | Local caching of last decomposition. Fallback to previous week's template. |

---

## 8. Success Metrics

### 8.1 Primary KPIs

| Metric | Target (30 days) | Measurement Method |
|---|---|---|
| Deep work session completion rate | > 60% of scheduled blocks completed | App usage logs |
| Alarm response rate | > 70% of alarms acknowledged within 5 min | Notification interaction logs |
| Distraction app block events per week | Declining week-over-week | App blocker event log |
| Weekly goal completion | > 50% of decomposed tasks done | Task completion log |
| App retention | Active use past day 14 | Local session count |

### 8.2 Qualitative Success
- User reports feeling less decision fatigue at start of day
- User can identify their own productive patterns after 4 weeks
- Deep work sessions feel less effortful to start

---

## 9. Out of Scope — v1.0

- Team or multi-user features
- Windows or Linux support
- Native iOS app (sync layer only in v1.0)
- Social or community features
- Therapist or coach integration
- Biometric data (heart rate, sleep) — future integration
