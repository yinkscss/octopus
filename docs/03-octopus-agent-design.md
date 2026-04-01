# OCTOPUS
## Agent Design Document
> AI Brain · Prompts · Decision Logic · Atomic Habits Engine
> Version 1.0 · March 2026 · Daniel Shittu

---

## 1. Agent Philosophy

Octopus is not a chatbot. It is an autonomous decision-making system that uses Claude as its reasoning engine. The agents run on a trigger basis — Sunday goal intake, daily monitoring, Sunday review — and produce structured outputs that directly configure the user's environment. The user does not converse with the AI. The AI works in the background and surfaces only actionable outputs.

> **AGENT DESIGN PRINCIPLE:** Every agent call must produce a concrete artefact: a task list, an alarm schedule, a block rule, or an insight. No agent call should produce advice that the user needs to act on manually. The agent acts on their behalf.

---

## 2. Agent Roster

| Agent | Trigger | Input | Output |
|---|---|---|---|
| Goal Decomposer | Sunday — user submits weekly goals | Raw goal text, identity statement, last week's patterns | tasks[], time_blocks[], alarm_labels[] |
| Schedule Builder | After Goal Decomposer | tasks[], user's known peak hours, existing calendar blocks | 7-day schedule with enforced blocks |
| Monitoring Agent | Every 30 minutes (background) | Current time, active app, completed tasks, drift events | Intervention notification if drift detected |
| Pattern Detector | Sunday morning before intake | 4 weeks of completion data, check-in logs, block events | insights[], next_week_adjustments[] |
| Atomic Habits Filter | Applied to all agent outputs | Any proposed habit, task, or schedule change | Filtered output through the 4 laws |

---

## 3. Goal Decomposer

### 3.1 System Prompt

```
You are the planning core of Octopus, a productivity enforcement system
for a user with ADHD. Your job is to take a set of weekly goals and decompose
them into a precise, actionable 7-day plan.

Rules you must follow:
- Apply the Two-Minute Rule from Atomic Habits: every new habit or task must
  have a version that takes under 2 minutes to begin.
- Apply implementation intentions: every task must have a "When X, I will Y"
  form embedded in the label.
- Never create more than 3 deep work blocks per day.
- Deep work blocks must be 90 minutes maximum. ADHD brains cannot sustain more.
- Every deep work block must be followed by a 20-minute recovery block.
- Label alarms using the user's own words from their goals, not generic phrases.
- Apply the identity statement to every task: does this move the user toward
  who they said they want to become?

Return ONLY valid JSON matching the TaskPlan schema. No explanation. No markdown.
```

### 3.2 Output Schema

```json
{
  "identity_statement": "string",
  "week_start": "YYYY-MM-DD",
  "tasks": [
    {
      "day": "monday | tuesday | ...",
      "title": "string",
      "implementation_intention": "string",
      "time_block": "HH:MM",
      "duration_minutes": "number (max 90 for deep work)",
      "type": "deep_work | recovery | habit | admin",
      "app_rules": ["string"],
      "two_minute_start": "string"
    }
  ],
  "alarms": [
    {
      "day": "string",
      "time": "HH:MM",
      "label": "string (user's own words)",
      "type": "wake | transition | intervention | wind_down"
    }
  ]
}
```

### 3.3 Example Input → Output

**User input:**
> "This week I want to finish the LangGraph refactor and start sleeping before midnight. I want to become someone who ships things."

**Agent output (truncated):**
```json
{
  "identity_statement": "Someone who ships things",
  "week_start": "2026-03-30",
  "tasks": [
    {
      "day": "monday",
      "title": "LangGraph refactor — context broker module",
      "implementation_intention": "When I sit down at 9am, I will open only the terminal and VS Code and work on the context broker until 10:30am.",
      "time_block": "09:00",
      "duration_minutes": 90,
      "type": "deep_work",
      "app_rules": ["Twitter", "YouTube", "Safari", "Messages"],
      "two_minute_start": "Open the repo and read the last commit message"
    }
  ],
  "alarms": [
    {
      "day": "monday",
      "time": "08:50",
      "label": "You said you'd finish the LangGraph refactor this week. It starts in 10 minutes.",
      "type": "transition"
    },
    {
      "day": "monday",
      "time": "23:30",
      "label": "You said you want to sleep before midnight. Close everything now.",
      "type": "wind_down"
    }
  ]
}
```

---

## 4. Pattern Detector

### 4.1 What It Analyses

- Completion rate per time-of-day slot (morning vs afternoon vs evening)
- Correlation between check-in energy score and task completion
- Most common drift triggers (which app was opened before abandoning a block)
- Alarm response latency — how long after alarm was task started
- Days of week where performance is consistently above/below average

### 4.2 System Prompt

```
You are the pattern analysis core of Octopus. You receive four weeks of
behaviour data from a user with ADHD: task completions, check-in logs, app
block events, and alarm response times.

Your job is to find real, actionable patterns and return them as concrete
configuration adjustments for next week.

Rules:
- Write all insights in second-person, direct language. No hedging.
- No passive voice. No "it appears that." State it plainly.
- Every insight must lead to a specific, automatic change in next week's config.
- Maximum 5 insights. Quality over quantity.
- If data is insufficient (< 2 weeks), say so and return an empty insights array.

Return ONLY valid JSON. No explanation. No markdown.
```

### 4.3 Output Schema

```json
{
  "week_analysed": "YYYY-MM-DD",
  "data_quality": "sufficient | insufficient",
  "insights": [
    {
      "observation": "string (plain language, second person)",
      "evidence": "string (specific data points that support it)",
      "config_change": {
        "type": "reschedule | add_buffer | change_alarm | add_block | remove_block",
        "details": "string"
      }
    }
  ],
  "next_week_adjustments": [
    {
      "field": "string",
      "old_value": "any",
      "new_value": "any",
      "reason": "string"
    }
  ]
}
```

### 4.4 Sample Insight Output

```json
{
  "insights": [
    {
      "observation": "You completed 6 out of 7 morning deep work blocks but only 2 out of 7 afternoon blocks.",
      "evidence": "Afternoon completions: Mon (no), Tue (yes), Wed (no), Thu (no), Fri (yes), Sat (no), Sun (no). YouTube opened within 10 minutes of all 5 failed afternoon sessions.",
      "config_change": {
        "type": "add_buffer",
        "details": "Afternoon deep work blocks now begin with a 5-minute walk alarm instead of jumping straight into work. YouTube blocked from 1pm–4pm on weekdays."
      }
    }
  ]
}
```

---

## 5. Monitoring Agent

### 5.1 Drift Detection Logic

The monitoring agent runs every 30 minutes in the background. It checks three conditions:

1. Is the current time inside a scheduled deep work block?
2. Is the currently active app on the block list for this block?
3. Has the scheduled task been marked as started?

If condition 1 is true and either 2 or 3 fails, a drift event is logged and an intervention notification is sent. The notification uses the alarm label from the original task — the user's own words.

### 5.2 Escalation Tiers

| Tier | Trigger | Action |
|---|---|---|
| Tier 1 — Nudge | First drift event in a block | Notification with reminder of current task and one-tap start button |
| Tier 2 — Push | Drift continues 10 min after Tier 1 | Louder notification + app force-close if on block list |
| Tier 3 — Lock | Drift continues 20 min after Tier 2 | All non-essential apps closed. DND activated. Wallpaper changes to task name. |

### 5.3 Intervention Notification Format

```
[ALARM LABEL — user's own words]
"You said you'd finish the LangGraph refactor today."

[Action Buttons]
  I'M ON IT    |    5 MORE MINUTES
```

- `I'M ON IT` → marks task as started, clears drift event, logs response time
- `5 MORE MINUTES` → logs drift, schedules Tier 2 in 5 minutes, no dismiss without action

---

## 6. Atomic Habits Engine

### 6.1 The Four Laws as Code Logic

Every agent output passes through `atomicHabits.ts` before being committed to the schedule. This is deterministic TypeScript logic — not a Claude call. It applies the four laws as validation rules.

| Law | Validation Rule | Rejection Condition |
|---|---|---|
| Make It Obvious | Every task must have an implementation intention | Task has no when/where/after anchor → agent must regenerate |
| Make It Attractive | Deep work blocks cannot start without a temptation bundle | No pairing defined → default pairing applied from preferences |
| Make It Easy | Every task must have a two-minute start defined | First action > 2 minutes → split into smaller start |
| Make It Hard | Every bad habit must have an inversion rule | Distraction app with no friction gate → auto-assigned intent gate |

### 6.2 TypeScript Interface

```typescript
interface AtomicHabitsFilter {
  makeItObvious(task: Task): ValidationResult;
  makeItAttractive(task: Task): ValidationResult;
  makeItEasy(task: Task): ValidationResult;
  makeItHard(habit: BadHabit): ValidationResult;
}

interface ValidationResult {
  passed: boolean;
  reason?: string;
  autoFix?: Partial<Task>;
}

// Usage — every task runs through all four filters before commit
function validateTaskPlan(plan: TaskPlan): TaskPlan {
  return {
    ...plan,
    tasks: plan.tasks.map(task => {
      const obvious    = filter.makeItObvious(task);
      const attractive = filter.makeItAttractive(task);
      const easy       = filter.makeItEasy(task);

      if (!obvious.passed)    return { ...task, ...obvious.autoFix };
      if (!attractive.passed) return { ...task, ...attractive.autoFix };
      if (!easy.passed)       return { ...task, ...easy.autoFix };

      return task;
    })
  };
}
```

---

## 7. Claude API Configuration

| Parameter | Value | Reason |
|---|---|---|
| Model | claude-sonnet-4-20250514 | Fast enough for interactive use; powerful enough for complex decomposition |
| Max tokens | 2000 | Task plans are structured JSON; 2000 tokens is sufficient for a full week |
| Temperature | 0.3 | Low temperature for consistent, structured JSON output |
| System prompt | Per-agent (see above) | Each agent has a distinct persona and output contract |
| Response format | JSON only | All outputs are parsed programmatically; no freeform text |

### 7.1 API Wrapper Pattern

```typescript
// src/lib/claude.ts
export async function callAgent<T>(
  systemPrompt: string,
  userMessage: string,
  schema: ZodSchema<T>
): Promise<T> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    })
  });

  const data = await response.json();
  const text = data.content[0].text;
  const parsed = JSON.parse(text);

  // Validate against Zod schema — reject malformed outputs
  return schema.parse(parsed);
}
```

---

## 8. Agent Failure Modes & Fallbacks

| Failure | Detection | Fallback |
|---|---|---|
| Claude API timeout | > 5s with no response | Use last week's plan with dates shifted forward |
| Malformed JSON output | Zod schema parse error | Retry once with stricter prompt; if fails again, use fallback |
| Empty tasks array | Schema validation | Surface error: "Agent couldn't decompose this goal. Try being more specific." |
| Pattern data insufficient | < 2 weeks of data | Skip auto-adjustment, show message: "More data needed for insights" |
| Monitoring agent crash | No heartbeat for > 10 min | LaunchAgent auto-restarts the daemon |
