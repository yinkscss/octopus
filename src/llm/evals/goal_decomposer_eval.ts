import cases from "./fixtures/goal_decomposer_cases.json";
import { validateTaskPlan } from "../../agents/atomicHabits";
import { TaskPlanSchema } from "../../types/taskPlan";

interface EvalCase {
  id: string;
  provider_failed: boolean;
  fallback_loaded: boolean;
  candidate_plan: unknown;
}

const thresholds = {
  schemaValidityRate: 0.98,
  implementationCoverage: 1,
  twoMinuteCoverage: 1,
  fallbackReliability: 0.95,
};

const evalCases = cases as EvalCase[];

let validCount = 0;
let implementationChecks = 0;
let implementationPass = 0;
let twoMinuteChecks = 0;
let twoMinutePass = 0;
let fallbackChecks = 0;
let fallbackPass = 0;

for (const item of evalCases) {
  try {
    const parsed = TaskPlanSchema.parse(item.candidate_plan);
    const filtered = validateTaskPlan(parsed);

    validCount += 1;

    for (const task of filtered.tasks) {
      implementationChecks += 1;
      if (task.implementation_intention.trim().length > 0) {
        implementationPass += 1;
      }

      twoMinuteChecks += 1;
      if (task.two_minute_start.trim().length > 0) {
        twoMinutePass += 1;
      }
    }
  } catch (error) {
    console.error(`[Eval] Case ${item.id} failed schema/filter validation`, error);
  }

  if (item.provider_failed) {
    fallbackChecks += 1;
    if (item.fallback_loaded) {
      fallbackPass += 1;
    }
  }
}

const schemaValidityRate = validCount / Math.max(evalCases.length, 1);
const implementationCoverage = implementationPass / Math.max(implementationChecks, 1);
const twoMinuteCoverage = twoMinutePass / Math.max(twoMinuteChecks, 1);
const fallbackReliability = fallbackPass / Math.max(fallbackChecks, 1);

const metrics = {
  schemaValidityRate,
  implementationCoverage,
  twoMinuteCoverage,
  fallbackReliability,
};

console.log("[Eval] Goal Decomposer Metrics");
console.table(metrics);

const failures: string[] = [];
if (schemaValidityRate < thresholds.schemaValidityRate) {
  failures.push(
    `schemaValidityRate ${schemaValidityRate.toFixed(2)} < ${thresholds.schemaValidityRate.toFixed(2)}`
  );
}
if (implementationCoverage < thresholds.implementationCoverage) {
  failures.push(
    `implementationCoverage ${implementationCoverage.toFixed(2)} < ${thresholds.implementationCoverage.toFixed(2)}`
  );
}
if (twoMinuteCoverage < thresholds.twoMinuteCoverage) {
  failures.push(
    `twoMinuteCoverage ${twoMinuteCoverage.toFixed(2)} < ${thresholds.twoMinuteCoverage.toFixed(2)}`
  );
}
if (fallbackReliability < thresholds.fallbackReliability) {
  failures.push(
    `fallbackReliability ${fallbackReliability.toFixed(2)} < ${thresholds.fallbackReliability.toFixed(2)}`
  );
}

if (failures.length > 0) {
  console.error("[Eval] FAILED");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  throw new Error(`Goal decomposer eval failed with ${failures.length} threshold violations.`);
}

console.log("[Eval] PASSED");
