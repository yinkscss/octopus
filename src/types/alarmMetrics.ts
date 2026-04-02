import { z } from "zod";

export const AlarmMetricsSchema = z.object({
  ack_latency_seconds: z.number().min(0),
  escalation_rate: z.number().min(0).max(1),
  snooze_rate: z.number().min(0).max(1),
  miss_rate: z.number().min(0).max(1),
  label_user_language_score: z.number().min(0).max(1),
});

export type AlarmMetrics = z.infer<typeof AlarmMetricsSchema>;
