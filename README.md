# octopus — GitHub Copilot Skill Environment

A GitHub Copilot skill environment configured with skills sourced from [yinkscss/skills](https://github.com/yinkscss/skills).

## Skills

The following skills are set up in this repository to enhance GitHub Copilot suggestions:

| Skill | Description |
|-------|-------------|
| [prompt-engineering](skills/prompt-engineering/SKILL.md) | Crafting and optimizing prompts for large language models |
| [rust-blockchain](skills/rust-blockchain/SKILL.md) | Building blockchain applications with Rust (Substrate, Solana/Anchor) |
| [langchain-typescript](skills/langchain-typescript/SKILL.md) | LangChain and LangGraph applications in TypeScript |
| [langchain-python](skills/langchain-python/SKILL.md) | LangChain and LangGraph applications in Python |

## GitHub Copilot

Copilot instructions are defined in [`.github/copilot-instructions.md`](.github/copilot-instructions.md). These instructions are automatically picked up by GitHub Copilot to provide contextually relevant suggestions aligned with the active skills.

## Skill Sources

All skills are sourced from the [yinkscss/skills](https://github.com/yinkscss/skills) repository, which contains Anthropic's Agent Skills standard implementation.
