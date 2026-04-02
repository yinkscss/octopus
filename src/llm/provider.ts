import type { ZodSchema } from "zod";

export interface AgentConfig {
  maxTokens: number;
  temperature: number;
  timeout: number;
  model?: string;
}

export interface LLMProvider {
  name: string;
  callAgent<T>(
    systemPrompt: string,
    userMessage: string,
    config: AgentConfig,
    schema: ZodSchema<T>
  ): Promise<T>;
}
