import { z } from "zod";

export const AlarmStateSchema = z.enum([
  "scheduled",
  "fired",
  "snoozed",
  "acknowledged",
  "escalated",
  "missed",
  "dismissed",
]);

export const AlarmActionSchema = z.enum([
  "i_am_on_it",
  "snooze_once",
  "escalated",
  "already_acknowledged",
  "already_escalated",
]);

export const AlarmEventSchema = z.object({
  event_type: z.string().min(1),
  event_at: z.string().min(1),
  metadata_json: z.string().optional().nullable(),
});

export const AlarmTimelineItemSchema = z.object({
  alarm_id: z.number().int().positive(),
  day: z.string().optional().nullable(),
  time: z.string().optional().nullable(),
  label: z.string().min(1),
  status: AlarmStateSchema,
  tier: z.number().int().min(1),
  events: z.array(AlarmEventSchema),
});

export const AlarmScheduleReportSchema = z.object({
  scheduled_count: z.number().int().min(0),
  failed_count: z.number().int().min(0),
  last_sync_at: z.string().min(1),
});

export const AlarmActionReportSchema = z.object({
  alarm_id: z.number().int().positive(),
  status: AlarmStateSchema,
  last_action: z.string().min(1),
  acted_at: z.string().min(1),
});

export const AlarmDaemonStatusSchema = z.object({
  running: z.boolean(),
  scheduled_jobs: z.number().int().min(0),
});

export type AlarmState = z.infer<typeof AlarmStateSchema>;
export type AlarmAction = z.infer<typeof AlarmActionSchema>;
export type AlarmEvent = z.infer<typeof AlarmEventSchema>;
export type AlarmTimelineItem = z.infer<typeof AlarmTimelineItemSchema>;
export type AlarmScheduleReport = z.infer<typeof AlarmScheduleReportSchema>;
export type AlarmActionReport = z.infer<typeof AlarmActionReportSchema>;
export type AlarmDaemonStatus = z.infer<typeof AlarmDaemonStatusSchema>;
