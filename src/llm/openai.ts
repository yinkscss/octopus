import { invoke } from "../lib/tauri";
import type { ZodSchema } from "zod";
import type { AgentConfig, LLMProvider } from "./provider";

export class OpenAIProvider implements LLMProvider {
  name = "openai";

  async callAgent<T>(
    systemPrompt: string,
    userMessage: string,
    config: AgentConfig,
    schema: ZodSchema<T>
  ): Promise<T> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error("OpenAI API key not set");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model ?? "gpt-4o",
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error("OpenAI response missing content");
      }

      const parsed = JSON.parse(text);
      return schema.parse(parsed);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("OpenAI request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getApiKey(): Promise<string> {
    return invoke("get_api_key", { provider: "openai" });
  }
}
