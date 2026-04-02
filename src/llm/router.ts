import type { ZodSchema } from "zod";
import type { AgentConfig, LLMProvider } from "./provider";

export class LLMRouter {
  constructor(
    private primaryProvider: LLMProvider,
    private fallbackProvider?: LLMProvider
  ) {}

  async callWithFallback<T>(
    systemPrompt: string,
    userMessage: string,
    config: AgentConfig,
    schema: ZodSchema<T>
  ): Promise<T> {
    const errors: string[] = [];

    try {
      console.log(`[LLM Router] Trying ${this.primaryProvider.name}`);
      const result = await this.primaryProvider.callAgent(
        systemPrompt,
        userMessage,
        config,
        schema
      );
      console.log(`[LLM Router] ${this.primaryProvider.name} succeeded`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[LLM Router] ${this.primaryProvider.name} failed: ${message}`);
      errors.push(`${this.primaryProvider.name}: ${message}`);
    }

    if (!this.fallbackProvider) {
      throw new Error(`Primary LLM provider failed. ${errors.join(" ")}`);
    }

    try {
      console.log(`[LLM Router] Trying ${this.fallbackProvider.name}`);
      const result = await this.fallbackProvider.callAgent(
        systemPrompt,
        userMessage,
        config,
        schema
      );
      console.log(`[LLM Router] ${this.fallbackProvider.name} succeeded`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[LLM Router] ${this.fallbackProvider.name} failed: ${message}`);
      errors.push(`${this.fallbackProvider.name}: ${message}`);
    }

    throw new Error(`All LLM providers failed. ${errors.join(" | ")}`);
  }
}
