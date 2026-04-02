import { z, ZodError } from "zod";
import goalDecomposerPrompt from "./prompts/goalDecomposer.system.txt?raw";
import { validateTaskPlan } from "./atomicHabits";
import { ClaudeProvider } from "../llm/claude";
import { OpenAIProvider } from "../llm/openai";
import { LLMRouter } from "../llm/router";
import type { AgentConfig } from "../llm/provider";
import { PlannerProviderError, PlannerValidationError } from "../types/errors";
import { TaskPlanSchema, type TaskPlan } from "../types/taskPlan";
import { useSettingsStore, type ProviderName } from "../store/settings";

export interface GoalDecomposerInput {
  rawGoals: string;
  identityStatement: string;
  weekStart: string;
  lastWeekPatterns?: string;
}

const plannerResponseSchema = z.unknown();

const plannerConfig: AgentConfig = {
  maxTokens: 3500,
  temperature: 0,
  timeout: 30000,
};

const createProvider = (provider: ProviderName) =>
  provider === "claude" ? new ClaudeProvider() : new OpenAIProvider();

const createRouter = () => {
  const { primaryProvider, fallbackProvider } = useSettingsStore.getState();
  return new LLMRouter(
    createProvider(primaryProvider),
    fallbackProvider ? createProvider(fallbackProvider) : undefined
  );
};

const createUserMessage = (input: GoalDecomposerInput) =>
  [
    `WEEK_START: ${input.weekStart}`,
    `IDENTITY_STATEMENT: ${input.identityStatement}`,
    `RAW_WEEKLY_GOALS: ${input.rawGoals}`,
    `LAST_WEEK_PATTERNS: ${input.lastWeekPatterns ?? "none"}`,
    "",
    "REQUIRED JSON SHAPE (use exactly these keys):",
    JSON.stringify(
      {
        identity_statement: "string",
        week_start: "YYYY-MM-DD",
        tasks: [
          {
            day: "monday|tuesday|wednesday|thursday|friday|saturday|sunday",
            title: "string",
            implementation_intention: "string",
            time_block: "HH:MM",
            duration_minutes: 45,
            type: "deep_work|recovery|habit|admin",
            app_rules: ["string"],
            two_minute_start: "string",
          },
        ],
        time_blocks: [
          {
            day: "monday|tuesday|wednesday|thursday|friday|saturday|sunday",
            start_time: "HH:MM",
            end_time: "HH:MM",
            mode: "string",
            app_rules: ["string"],
          },
        ],
        alarms: [
          {
            day: "monday|tuesday|wednesday|thursday|friday|saturday|sunday",
            time: "HH:MM",
            label: "string",
            type: "wake|transition|intervention|wind_down",
          },
        ],
      },
      null,
      2
    ),
  ].join("\n\n");

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const pick = (record: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
  return undefined;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return undefined;
};

const parseTime = (value: unknown, fallback = "09:00"): string => {
  const raw = asString(value);
  if (!raw) {
    return fallback;
  }

  const hhmm = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    const h = Number(hhmm[1]);
    const m = Number(hhmm[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }

  const ampm = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (ampm) {
    const hour12 = Number(ampm[1]);
    const minute = Number(ampm[2] ?? "0");
    const period = ampm[3].toLowerCase();
    let hour24 = hour12 % 12;
    if (period === "pm") {
      hour24 += 12;
    }

    return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  return fallback;
};

const addMinutes = (hhmm: string, minutes: number): string => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const outH = Math.floor(wrapped / 60);
  const outM = wrapped % 60;
  return `${String(outH).padStart(2, "0")}:${String(outM).padStart(2, "0")}`;
};

const normalizeDay = (value: unknown, index: number): (typeof DAY_ORDER)[number] => {
  const raw = asString(value)?.toLowerCase();
  if (!raw) {
    return DAY_ORDER[index % DAY_ORDER.length];
  }

  const aliases: Record<string, (typeof DAY_ORDER)[number]> = {
    mon: "monday",
    monday: "monday",
    tue: "tuesday",
    tues: "tuesday",
    tuesday: "tuesday",
    wed: "wednesday",
    weds: "wednesday",
    wednesday: "wednesday",
    thu: "thursday",
    thur: "thursday",
    thurs: "thursday",
    thursday: "thursday",
    fri: "friday",
    friday: "friday",
    sat: "saturday",
    saturday: "saturday",
    sun: "sunday",
    sunday: "sunday",
  };

  return aliases[raw] ?? DAY_ORDER[index % DAY_ORDER.length];
};

const normalizeTaskType = (value: unknown): "deep_work" | "recovery" | "habit" | "admin" => {
  const raw = asString(value)?.toLowerCase();
  if (!raw) {
    return "admin";
  }

  if (raw.includes("deep")) {
    return "deep_work";
  }

  if (raw.includes("recover") || raw.includes("break") || raw.includes("rest")) {
    return "recovery";
  }

  if (raw.includes("habit")) {
    return "habit";
  }

  return "admin";
};

const normalizeDuration = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.min(90, Math.round(value)));
  }

  const fromString = Number(asString(value));
  if (Number.isFinite(fromString)) {
    return Math.max(1, Math.min(90, Math.round(fromString)));
  }

  return 60;
};

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => asString(entry))
      .filter((entry): entry is string => Boolean(entry));
  }

  const one = asString(value);
  return one ? [one] : [];
};

const extractPlanRoot = (raw: unknown): Record<string, unknown> => {
  const record = asRecord(raw);
  const nested = pick(record, ["plan", "task_plan", "result", "output"]);
  if (nested) {
    return asRecord(nested);
  }

  return record;
};

const normalizeTasks = (root: Record<string, unknown>): TaskPlan["tasks"] => {
  const rawTasks = pick(root, ["tasks", "task_list", "daily_tasks"]);
  const taskArray = Array.isArray(rawTasks) ? rawTasks : [];

  return taskArray.map((task, index) => {
    const taskRecord = asRecord(task);
    const fallbackTitle = asString(task) ?? `Task ${index + 1}`;
    const title =
      asString(pick(taskRecord, ["title", "task", "task_title", "name", "action"])) ??
      fallbackTitle;
    const timeBlock = parseTime(
      pick(taskRecord, ["time_block", "timeBlock", "start_time", "startTime", "time"]),
      "09:00"
    );

    return {
      day: normalizeDay(pick(taskRecord, ["day", "weekday", "day_of_week"]), index),
      title,
      implementation_intention:
        asString(
          pick(taskRecord, [
            "implementation_intention",
            "implementationIntention",
            "intention",
            "implementation",
          ])
        ) ?? `When it is ${timeBlock}, I will ${title}.`,
      time_block: timeBlock,
      duration_minutes: normalizeDuration(
        pick(taskRecord, ["duration_minutes", "durationMinutes", "duration", "duration_min"])
      ),
      type: normalizeTaskType(pick(taskRecord, ["type", "task_type", "category"])),
      app_rules: normalizeStringArray(
        pick(taskRecord, ["app_rules", "appRules", "blocked_apps", "apps_to_block"])
      ),
      two_minute_start:
        asString(
          pick(taskRecord, [
            "two_minute_start",
            "twoMinuteStart",
            "first_step",
            "firstStep",
            "start_step",
          ])
        ) ?? `Open your workspace and start ${title}.`,
      status: "pending" as const,
    };
  });
};

const normalizeTimeBlocks = (
  root: Record<string, unknown>,
  tasks: TaskPlan["tasks"]
): TaskPlan["time_blocks"] => {
  const rawBlocks = pick(root, ["time_blocks", "timeBlocks", "blocks", "schedule"]);
  const blockArray = Array.isArray(rawBlocks) ? rawBlocks : [];

  if (blockArray.length > 0) {
    return blockArray.map((block, index) => {
      const record = asRecord(block);
      const start = parseTime(
        pick(record, ["start_time", "startTime", "time", "time_block"]),
        tasks[index]?.time_block ?? "09:00"
      );
      const duration = normalizeDuration(pick(record, ["duration_minutes", "duration", "length"]));

      return {
        day: normalizeDay(pick(record, ["day", "weekday", "day_of_week"]), index),
        start_time: start,
        end_time: parseTime(pick(record, ["end_time", "endTime"]), addMinutes(start, duration)),
        mode:
          asString(pick(record, ["mode", "type", "label"])) ??
          tasks[index]?.type ??
          "admin",
        app_rules: normalizeStringArray(pick(record, ["app_rules", "appRules"])),
      };
    });
  }

  return tasks.map((task) => ({
    day: task.day,
    start_time: task.time_block,
    end_time: addMinutes(task.time_block, task.duration_minutes),
    mode: task.type,
    app_rules: task.app_rules,
  }));
};

const normalizeAlarms = (
  root: Record<string, unknown>,
  tasks: TaskPlan["tasks"]
): TaskPlan["alarms"] => {
  const rawAlarms = pick(root, ["alarms", "alarm_labels", "alarmLabels"]);
  const alarmArray = Array.isArray(rawAlarms) ? rawAlarms : [];

  if (alarmArray.length > 0) {
    return alarmArray.map((alarm, index) => {
      const record = asRecord(alarm);
      const linkedTask = tasks[index % Math.max(tasks.length, 1)];
      const day = normalizeDay(
        pick(record, ["day", "weekday", "day_of_week"]),
        index
      );
      const typeRaw = asString(pick(record, ["type", "alarm_type", "kind"]))?.toLowerCase();
      const type =
        typeRaw === "wake" ||
        typeRaw === "transition" ||
        typeRaw === "intervention" ||
        typeRaw === "wind_down"
          ? typeRaw
          : "transition";

      return {
        day,
        time: parseTime(
          pick(record, ["time", "alarm_time", "at"]),
          linkedTask ? addMinutes(linkedTask.time_block, -10) : "08:50"
        ),
        label:
          asString(pick(record, ["label", "message", "text"])) ??
          (linkedTask
            ? `You said you'd ${linkedTask.title}. Start now.`
            : "Start your planned task now."),
        type,
        status: "scheduled" as const,
      };
    });
  }

  return tasks.map((task) => ({
    day: task.day,
    time: addMinutes(task.time_block, -10),
    label: `You said you'd ${task.title}. Start now.`,
    type: "transition" as const,
    status: "scheduled" as const,
  }));
};

const normalizePlan = (raw: unknown, input: GoalDecomposerInput): TaskPlan => {
  const root = extractPlanRoot(raw);
  const tasks = normalizeTasks(root);

  if (tasks.length === 0) {
    throw new PlannerValidationError(
      "Planner response did not include usable tasks."
    );
  }

  const normalized: TaskPlan = {
    identity_statement:
      asString(
        pick(root, [
          "identity_statement",
          "identityStatement",
          "identity",
          "identity_goal",
        ])
      ) ?? input.identityStatement,
    week_start: input.weekStart,
    tasks,
    time_blocks: normalizeTimeBlocks(root, tasks),
    alarms: normalizeAlarms(root, tasks),
  };

  return TaskPlanSchema.parse(normalized);
};

export const decomposeWeeklyGoals = async (
  input: GoalDecomposerInput
): Promise<TaskPlan> => {
  if (!input.rawGoals.trim()) {
    throw new PlannerValidationError("Weekly goals cannot be empty");
  }

  if (!input.identityStatement.trim()) {
    throw new PlannerValidationError("Identity statement cannot be empty");
  }

  const router = createRouter();

  try {
    const result = await router.callWithFallback(
      goalDecomposerPrompt,
      createUserMessage(input),
      plannerConfig,
      plannerResponseSchema
    );

    return validateTaskPlan(normalizePlan(result, input));
  } catch (error) {
    if (error instanceof PlannerValidationError) {
      throw error;
    }

    if (error instanceof ZodError || error instanceof z.ZodError) {
      throw new PlannerValidationError(`Planner response failed schema validation: ${error.message}`);
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new PlannerProviderError(message);
  }
};
