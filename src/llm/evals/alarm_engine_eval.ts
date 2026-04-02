import cases from "./fixtures/alarm_engine_cases.json";

interface AlarmEvalCase {
  id: string;
  due: number;
  fired: number;
  expected_escalation_after_seconds: number;
  observed_escalation_after_seconds: number;
  snooze_attempts: number;
  second_snooze_blocked: boolean;
  ack_actions: number;
  ack_events_with_timestamp: number;
  duplicate_deliveries: number;
  total_deliveries: number;
  provider_goal_text_overlap_score: number;
  restart_recovered: boolean;
  restart_expected: boolean;
  idle_cpu_percent: number;
}

const fixtures = cases as AlarmEvalCase[];

const aggregate = fixtures.reduce(
  (acc, item) => {
    acc.due += item.due;
    acc.fired += item.fired;

    const expected = Math.max(item.expected_escalation_after_seconds, 1);
    const delta = Math.abs(item.observed_escalation_after_seconds - expected);
    const withinWindow = delta <= 10 ? 1 : 0;
    acc.escalationWithinWindow += withinWindow;
    acc.escalationChecks += 1;

    if (item.snooze_attempts >= 2) {
      acc.secondSnoozeAttempts += 1;
      if (item.second_snooze_blocked) {
        acc.secondSnoozeBlocked += 1;
      }
    }

    acc.ackActions += item.ack_actions;
    acc.ackEventsWithTimestamp += item.ack_events_with_timestamp;

    acc.duplicateDeliveries += item.duplicate_deliveries;
    acc.totalDeliveries += item.total_deliveries;

    acc.labelOverlapTotal += item.provider_goal_text_overlap_score;

    if (item.restart_expected) {
      acc.restartChecks += 1;
      if (item.restart_recovered) {
        acc.restartRecovered += 1;
      }
    }

    acc.idleCpuSamples += item.idle_cpu_percent;
    return acc;
  },
  {
    due: 0,
    fired: 0,
    escalationWithinWindow: 0,
    escalationChecks: 0,
    secondSnoozeAttempts: 0,
    secondSnoozeBlocked: 0,
    ackActions: 0,
    ackEventsWithTimestamp: 0,
    duplicateDeliveries: 0,
    totalDeliveries: 0,
    labelOverlapTotal: 0,
    restartChecks: 0,
    restartRecovered: 0,
    idleCpuSamples: 0,
  }
);

const notificationFireReliability = aggregate.fired / Math.max(aggregate.due, 1);
const escalationTimingAccuracy =
  aggregate.escalationWithinWindow / Math.max(aggregate.escalationChecks, 1);
const oneSnoozeEnforcement =
  aggregate.secondSnoozeBlocked / Math.max(aggregate.secondSnoozeAttempts, 1);
const ackLoggingCompleteness =
  aggregate.ackEventsWithTimestamp / Math.max(aggregate.ackActions, 1);
const duplicateDeliveryRate =
  aggregate.duplicateDeliveries / Math.max(aggregate.totalDeliveries, 1);
const labelUserLanguageCoverage =
  aggregate.labelOverlapTotal / Math.max(fixtures.length, 1);
const restartRecoverySuccess =
  aggregate.restartRecovered / Math.max(aggregate.restartChecks, 1);
const idleCpuPercent = aggregate.idleCpuSamples / Math.max(fixtures.length, 1);

const metrics = {
  notificationFireReliability,
  escalationTimingAccuracy,
  oneSnoozeEnforcement,
  ackLoggingCompleteness,
  duplicateDeliveryRate,
  labelUserLanguageCoverage,
  restartRecoverySuccess,
  idleCpuPercent,
};

console.log("[Eval] Alarm Engine Metrics");
console.table(metrics);

const failures: string[] = [];

if (notificationFireReliability < 0.99) {
  failures.push(`notificationFireReliability ${notificationFireReliability.toFixed(4)} < 0.99`);
}
if (escalationTimingAccuracy < 0.99) {
  failures.push(`escalationTimingAccuracy ${escalationTimingAccuracy.toFixed(4)} < 0.99`);
}
if (oneSnoozeEnforcement < 1.0) {
  failures.push(`oneSnoozeEnforcement ${oneSnoozeEnforcement.toFixed(4)} < 1.00`);
}
if (ackLoggingCompleteness < 1.0) {
  failures.push(`ackLoggingCompleteness ${ackLoggingCompleteness.toFixed(4)} < 1.00`);
}
if (duplicateDeliveryRate > 0.001) {
  failures.push(`duplicateDeliveryRate ${duplicateDeliveryRate.toFixed(6)} > 0.001`);
}
if (labelUserLanguageCoverage < 0.95) {
  failures.push(`labelUserLanguageCoverage ${labelUserLanguageCoverage.toFixed(4)} < 0.95`);
}
if (restartRecoverySuccess < 1.0) {
  failures.push(`restartRecoverySuccess ${restartRecoverySuccess.toFixed(4)} < 1.00`);
}
if (idleCpuPercent >= 1.0) {
  failures.push(`idleCpuPercent ${idleCpuPercent.toFixed(4)} >= 1.0`);
}

if (failures.length > 0) {
  console.error("[Eval] FAILED");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  throw new Error(`Alarm engine eval failed with ${failures.length} threshold violations.`);
}

console.log("[Eval] PASSED");
