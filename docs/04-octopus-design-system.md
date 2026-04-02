# OCTOPUS
## Design System
> Visual Language · Components · UX Principles · ADHD-First Design
> Version 1.0 · March 2026 · Daniel Shittu

---

## 1. Design Philosophy

Octopus is not a calming wellness app. It is an enforcement tool with a personality: firm, clear, and a little intimidating — because that is what ADHD brains respond to. But it is never chaotic. The visual language is precise, minimal, and deliberate. Every element on screen has one job.

> **DESIGN MANDATE:** One primary action visible at a time. No element competes for attention. The app does the thinking so the brain does not have to.

### The Personality in Three Words

**Firm. Clear. Unignorable.**

Not aggressive. Not cold. Think: the most reliable person you know — the one who tells you the truth without making you feel bad about it. That's the tone. Every label, every notification, every confirmation dialog speaks in that voice.

---

## 2. Typography

| Role | Font | Weight | Size | Usage |
|---|---|---|---|---|
| Display | Syne | 800 (Extra Bold) | 32–48px | Screen titles, mode names, identity statement |
| Heading | Syne | 700 (Bold) | 20–28px | Section headers, task titles |
| Body | IBM Plex Mono | 400 (Regular) | 14–16px | Task labels, descriptions, pattern insights |
| Data | IBM Plex Mono | 500 (Medium) | 12–14px | Times, durations, metrics |
| UI Label | IBM Plex Sans | 500 (Medium) | 12–13px | Buttons, tags, navigation |

**Font import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@500&display=swap');
```

**Rationale:** Syne is geometric and assertive — it commands attention without screaming. IBM Plex Mono treats the app like a terminal for your life — precise, functional, unflinching. The combination reads as intelligent and operational, not decorative.

---

## 3. Colour System

```css
:root {
  /* Backgrounds */
  --bg-base:       #0F0F0F;   /* App background — near black */
  --bg-surface:    #1A1A1A;   /* Card / panel backgrounds */
  --bg-raised:     #242424;   /* Elevated elements, active states */

  /* Accents */
  --accent-primary: #2ECC9A;  /* Teal-green — completion, active mode, CTA */
  --accent-danger:  #E84545;  /* Enforcement red — block events, override warnings */
  --accent-gold:    #E8A838;  /* Pattern insights, Sunday review, attention */

  /* Text */
  --text-primary:   #F0EDE8;  /* Main body — warm off-white, easier on eyes */
  --text-secondary: #8A8580;  /* Subtitles, timestamps, secondary labels */
  --text-disabled:  #444240;  /* Inactive states, unavailable actions */

  /* Borders */
  --border-subtle:  #2A2A2A;  /* Card borders, dividers */
  --border-active:  #2ECC9A;  /* Focused inputs, active blocks */
}
```

**Why dark-first:** ADHD brains are sensitive to overstimulation. A bright white interface creates cognitive noise. The near-black base with teal and red accents gives clear signal hierarchy without visual fatigue. This is non-negotiable.

### Colour Usage Rules

- `--accent-primary` (teal) = something is active, working, going well
- `--accent-danger` (red) = enforcement happening, override warning, something is being blocked
- `--accent-gold` (gold) = information to pay attention to — insights, patterns, Sunday review
- Never use more than two accent colours on the same screen
- Background hierarchy: base → surface → raised. Never reverse this.

---

## 4. Spacing & Layout

```css
:root {
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  40px;
  --space-2xl: 64px;

  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
}
```

**Menu bar popup dimensions:** 380px wide × 520px tall. Fixed. No resizing.

**Layout principle:** One column. No sidebars on the popup. Sidebars require eye tracking across a wide area — exhausting for ADHD users. Everything stacks vertically.

---

## 5. Core UX Principles

### 5.1 One Primary Action Per Screen

Every screen has exactly one button that is obviously the next step. Secondary actions are smaller, lower contrast, and not competing. The user should never have to decide what to tap.

### 5.2 Large Tap Targets

Minimum interactive element height: **56px**. ADHD users often interact quickly and imprecisely. Small targets create friction and frustration.

### 5.3 No Streaks as Primary Metric

Streaks are hidden from the main dashboard. Available in Patterns but never prominent. Breaking a streak should not be a salient visual event. The metric that matters is **this week**, not all time.

### 5.4 Alarm Labels Use Your Words

Every notification, alarm, and intervention message is written in the user's own language — pulled from their goal intake. "You said you'd finish the LangGraph refactor today" hits differently than "Time to work."

### 5.5 Confirmation Dialogs Are Interventions

Disabling enforcement, overriding a block, or bypassing a session all require confirmation steps that include the identity statement. The confirmation is not a friction point — it is the last line of defence.

**Example override dialog:**
```
You're about to disable enforcement.

You said you want to become:
"Someone who ships things."

Type your goal to confirm:
[ _________________________ ]

[ DISABLE ]    [ GO BACK ]
```

### 5.6 Time Is Always Visible

The current mode and time remaining in the active block is always in the menu bar. Never hidden. The ADHD brain has time blindness — the app externalises time awareness so the user doesn't have to maintain it internally.

---

## 6. Screen Breakdown

| Screen | Primary Action | Key Elements |
|---|---|---|
| Menu Bar Popup | Start / pause current block | Mode badge, current task, time remaining, quick check-in |
| Weekly Intent (Sunday) | Submit goals for the week | Large text input, identity statement, previous week summary |
| Dashboard (Today) | Mark current task done | Current task (ONE, large), upcoming blocks, mood ring |
| Patterns | Review Sunday report | 4-week heatmap, 3 key insights, next week preview |
| Settings | Configure block rules | App list with block schedules, sync status, permissions |
| Onboarding | Grant permissions | 5-step flow: identity → permissions → first goal → first block → done |

---

## 7. Component Library

### 7.1 Mode Badge

Displays current enforcement mode. Always visible in menu bar.

```
States:
  ● DEEP WORK     — teal background, white text
  ● RECOVERY      — gold background, dark text
  ● WIND DOWN     — muted grey, secondary text
  ● LOCKED        — red background, white text
  ● FREE          — surface background, secondary text
```

### 7.2 Task Card

Single card. Full width. One task only — never a list.

```
┌─────────────────────────────────────────┐
│  DEEP WORK  ·  09:00 → 10:30            │  ← mode badge + time
│                                         │
│  LangGraph refactor                     │  ← Syne Bold, 24px
│  context broker module                  │
│                                         │
│  When I sit down at 9am, I will open    │  ← implementation intention
│  only the terminal and VS Code.         │     IBM Plex Mono, 13px
│                                         │
│  ▶  START SESSION                       │  ← primary CTA, 56px height
└─────────────────────────────────────────┘
```

On start: timer begins, block rules activate, card border transitions to teal over 300ms.

### 7.3 Intent Gate Modal

Appears when a blocked app is launched. Full-screen overlay.

```
┌─────────────────────────────────────────┐
│                                         │
│         You're opening Twitter.         │  ← app name, Syne Bold
│                                         │
│   You're in a DEEP WORK block.          │
│   You said you'd finish the LangGraph   │
│   refactor today.                       │
│                                         │
│   Why right now?                        │  ← text input, required
│   ┌─────────────────────────────────┐   │
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
│   [ PROCEED ]       [ GO BACK ]         │
│                                         │
└─────────────────────────────────────────┘
```

- `PROCEED` logs intent text and allows app to open (drift event recorded)
- `GO BACK` closes modal, returns focus to task card

### 7.4 Mood Ring

Three-tap check-in. Under 5 seconds. No numbers — icons only.

```
How are you right now?

Energy:  😴  ⚡  🔥
Mood:    😔  😐  😊
```

Tapping an icon confirms that dimension. Optional note input appears after both are selected. Data feeds the pattern detector.

### 7.5 Intervention Notification (macOS)

```
OCTOPUS
You said you'd finish the LangGraph refactor today.
You're in a deep work block. Twitter is open.

[  I'M ON IT  ]     [  5 MORE MINUTES  ]
```

- No dismiss without action. Both buttons require a tap.
- `I'M ON IT` → task marked started, drift event cleared, response time logged
- `5 MORE MINUTES` → drift logged, Tier 2 scheduled in 5 minutes

### 7.6 Sunday Review Card

```
┌─────────────────────────────────────────┐
│  WEEK OF MARCH 30                       │
│                                         │
│  4 / 7 goals completed                  │  ← completion summary
│                                         │
│  ── KEY INSIGHT ──                      │
│                                         │
│  You complete morning blocks 85% of     │  ← plain language, second person
│  the time. Afternoon blocks: 28%.       │
│  YouTube was the trigger in 4/5         │
│  failed sessions.                       │
│                                         │
│  NEXT WEEK: YouTube blocked 1pm–4pm.    │  ← config change applied
│                                         │
│  [ VIEW FULL REPORT ]                   │
└─────────────────────────────────────────┘
```

---

## 8. Animation Principles

- All transitions: **200ms ease-out**. Never slower. ADHD patience for UI animation is near zero.
- Task completion: brief teal flash (150ms) + checkmark icon. Satisfying, not distracting.
- Block activation: border colour transitions from `--border-subtle` to `--accent-primary` over 300ms.
- Tier 3 lock: full-screen teal overlay with task name in display font at 48px. This is intentionally dramatic.
- No looping animations on the main dashboard. Motion only on state change.
- Reduced motion: respect `prefers-reduced-motion`. All animations disabled if set.

---

## 9. Onboarding Flow

Five steps. No skipping. Each step has one action.

```
Step 1 — IDENTITY
"Who are you trying to become?"
Large text input. One sentence. This anchors everything.

Step 2 — PERMISSIONS
Grant: Accessibility, Screen Recording, Notifications, Full Disk Access
Each permission explained in one line: what it does, why it's needed.

Step 3 — FIRST GOAL
"What do you want to get done this week?"
The Goal Decomposer runs. User sees their plan generated live.

Step 4 — FIRST BLOCK
"Let's set up your first deep work block."
Walk through the time block config. First alarm set.

Step 5 — DONE
"Octopus is active."
Mode badge shown. First alarm time confirmed. One CTA: "Start my week."
```

---

## 10. Design Tokens Reference

```css
/* Full token export for the React component library */
:root {
  /* Typography */
  --font-display: 'Syne', sans-serif;
  --font-body:    'IBM Plex Mono', monospace;
  --font-ui:      'IBM Plex Sans', sans-serif;

  --text-display:  48px;
  --text-h1:       32px;
  --text-h2:       24px;
  --text-h3:       20px;
  --text-body:     15px;
  --text-small:    13px;
  --text-xs:       11px;

  /* Colours */
  --bg-base:        #0F0F0F;
  --bg-surface:     #1A1A1A;
  --bg-raised:      #242424;
  --accent-primary: #2ECC9A;
  --accent-danger:  #E84545;
  --accent-gold:    #E8A838;
  --text-primary:   #F0EDE8;
  --text-secondary: #8A8580;
  --text-disabled:  #444240;
  --border-subtle:  #2A2A2A;
  --border-active:  #2ECC9A;

  /* Spacing */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  40px;
  --space-2xl: 64px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;

  /* Motion */
  --duration-fast:   150ms;
  --duration-normal: 200ms;
  --duration-slow:   300ms;
  --easing-default:  ease-out;
}
```
