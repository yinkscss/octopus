import { z } from "zod";

export const DaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const TaskTypeSchema = z.enum(["deep_work", "recovery", "habit", "admin"]);

export const TimeStringSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
  message: "Expected HH:MM 24-hour format",
});

export const TaskSchema = z.object({
  id: z.number().int().positive().optional(),
  day: DaySchema,
  title: z.string().min(1),
  implementation_intention: z.string().min(1),
  time_block: TimeStringSchema,
  duration_minutes: z.number().int().min(1).max(90),
  type: TaskTypeSchema,
  app_rules: z.array(z.string()).default([]),
  two_minute_start: z.string().min(1),
  status: z.enum(["pending", "done"]).optional(),
});

export const TimeBlockSchema = z.object({
  day: DaySchema,
  start_time: TimeStringSchema,
  end_time: TimeStringSchema,
  mode: z.string().min(1),
  app_rules: z.array(z.string()).default([]),
});

export const AlarmTypeSchema = z.enum([
  "wake",
  "transition",
  "intervention",
  "wind_down",
]);

export const AlarmSchema = z.object({
  id: z.number().int().positive().optional(),
  day: DaySchema,
  time: TimeStringSchema,
  label: z.string().min(1),
  type: AlarmTypeSchema,
  tier: z.number().int().min(1).optional(),
  status: z
    .enum([
      "scheduled",
      "fired",
      "snoozed",
      "acknowledged",
      "escalated",
      "dismissed",
      "missed",
    ])
    .optional(),
});

export const TaskPlanSchema = z.object({
  identity_statement: z.string().min(1),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tasks: z.array(TaskSchema),
  time_blocks: z.array(TimeBlockSchema),
  alarms: z.array(AlarmSchema),
});

export type Task = z.infer<typeof TaskSchema>;
export type TimeBlock = z.infer<typeof TimeBlockSchema>;
export type Alarm = z.infer<typeof AlarmSchema>;
export type TaskPlan = z.infer<typeof TaskPlanSchema>;

export const parseTaskPlan = (input: unknown): TaskPlan => TaskPlanSchema.parse(input);
