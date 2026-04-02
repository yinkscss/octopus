import { readFileSync } from "node:fs";
import { join } from "node:path";

const fixturePath = join(process.cwd(), "src", "llm", "evals", "fixtures", "alarm_engine_cases.json");
const data = JSON.parse(readFileSync(fixturePath, "utf8")) as Array<{
  id: string;
  due: number;
  fired: number;
  second_snooze_blocked: boolean;
}>;

const invalid = data.filter((entry) => entry.fired > entry.due || !entry.second_snooze_blocked);
if (invalid.length > 0) {
  console.error("[Smoke] Alarm fixture validation failed");
  for (const item of invalid) {
    console.error(`- ${item.id}`);
  }
  process.exit(1);
}

console.log(`[Smoke] Alarm fixture validation passed for ${data.length} cases.`);
