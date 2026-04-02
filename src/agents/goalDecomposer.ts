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

const plannerResponseSchema = TaskPlanSchema;

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
  ].join("\n\n");

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

    const withExpectedWeek = {
      ...result,
      week_start: input.weekStart,
      identity_statement: input.identityStatement,
    };

    return validateTaskPlan(TaskPlanSchema.parse(withExpectedWeek));
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
