import { invoke } from "@tauri-apps/api";
import type { ZodSchema } from "zod";
import type { AgentConfig, LLMProvider } from "./provider";

export class ClaudeProvider implements LLMProvider {
  name = "claude";

  async callAgent<T>(
    systemPrompt: string,
    userMessage: string,
    config: AgentConfig,
    schema: ZodSchema<T>
  ): Promise<T> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error("Claude API key not set");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.model ?? "claude-sonnet-4-20250514",
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude request failed: ${response.status} ${errorText}`);
      }

      const data = (await response.json()) as {
        content?: Array<{ text?: string }>;
      };
      const text = data.content?.[0]?.text;
      if (!text) {
        throw new Error("Claude response missing content");
      }

      const parsed = JSON.parse(text);
      return schema.parse(parsed);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Claude request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getApiKey(): Promise<string> {
    return invoke("get_api_key", { provider: "claude" });
  }
}
