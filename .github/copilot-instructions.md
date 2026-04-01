# GitHub Copilot Instructions

This repository uses skills sourced from [yinkscss/skills](https://github.com/yinkscss/skills). The following skills are active and guide Copilot suggestions in this project:

## Active Skills

| Skill | Description | Location |
|-------|-------------|----------|
| `prompt-engineering` | Crafting, optimizing, and analyzing prompts for LLMs | `skills/prompt-engineering/SKILL.md` |
| `rust-blockchain` | Building blockchain applications with Rust (Substrate, Solana/Anchor) | `skills/rust-blockchain/SKILL.md` |
| `langchain-typescript` | Building AI agents and applications with LangChain/LangGraph in TypeScript | `skills/langchain-typescript/SKILL.md` |
| `langchain-python` | Building AI agents and applications with LangChain/LangGraph in Python | `skills/langchain-python/SKILL.md` |

---

## Prompt Engineering

When writing or reviewing prompts for LLMs:

1. **Use structural XML delimiters** — wrap instructions in `<role>`, `<context>`, `<task>`, `<format>`, `<constraints>` tags to separate instructions from data.
2. **Use imperative verbs** — start instructions with Write, Classify, Summarize, Translate, Extract, Generate, Analyze, Compare.
3. **Be explicit** — specify exact output format, length constraints, style requirements.
4. **Use Chain-of-Thought (CoT)** for complex reasoning — force reasoning inside `<thinking>` tags before the final answer.
5. **Use few-shot examples** (2–5) for tasks requiring a specific format.
6. **Avoid negative instructions** — state what TO do, not what NOT to do.
7. **Question Stacking** — for strategic tasks, first ask the model what questions an expert would ask, then answer them, then execute.
8. **The Goldilocks Rule** — system prompts should define desired outcomes and constraints, not brittle if-then trees.

**Risk mitigation:**
- Prevent prompt injection by separating user content from instructions
- Mitigate hallucinations with RAG, citations, and self-consistency

---

## Rust (Blockchain)

When writing Rust blockchain code:

1. **Use checked arithmetic** everywhere to prevent integer overflow (`checked_add`, `checked_mul`, etc.)
2. **Validate all inputs** — never trust untrusted data.
3. **Follow checks-effects-interactions pattern** to prevent reentrancy.
4. **Use bounded collections** (`BoundedVec`, `BoundedBTreeMap`) to prevent unbounded storage growth.
5. **Emit events** for all critical state changes.
6. **Write comprehensive tests** — unit, integration, and property-based (proptest).
7. **Run `cargo audit` and `cargo clippy -- -D warnings`** before deployment.
8. **Deploy progressively**: dev → testnet → mainnet.

**Platform guidance:**
- **Substrate**: modular pallets, FRAME, forkless upgrades
- **Solana/Anchor**: PDAs, CPIs, high-throughput programs
- **CosmWasm**: IBC-compatible contracts

---

## TypeScript (LangChain / LangGraph)

When building LangChain/LangGraph TypeScript applications:

1. **Start simple** — use `createReactAgent` before reaching for LangGraph.
2. **Use TypeScript types** — leverage strict typing with Zod schemas for tool definitions and structured outputs.
3. **Handle errors** — wrap LLM calls in try-catch; implement retries and fallbacks.
4. **Stream responses** for better UX on long operations.
5. **Use LangSmith** for production tracing and debugging.
6. **Cache repeated operations** to reduce API costs.

**Complexity ladder**:
1. Single `ChatOpenAI` call
2. `createReactAgent` with tools
3. LCEL chains for multi-step processing
4. `StateGraph` for conditional logic / loops
5. Multi-agent nodes in a `StateGraph`

**Installation:**
```bash
npm install @langchain/core @langchain/openai @langchain/langgraph langchain
```

---

## Python (LangChain / LangGraph)

When building LangChain/LangGraph Python applications:

1. **Start simple** — use `create_react_agent` / `AgentExecutor` before reaching for LangGraph.
2. **Use type hints** throughout for clarity and IDE support.
3. **Handle errors** with try-except; use `verbose=True` for debugging.
4. **Stream responses** for better UX on long operations.
5. **Use LangSmith** (`LANGCHAIN_TRACING_V2=true`) for production tracing.
6. **Use RAG** (`create_retrieval_chain`) for document Q&A.

**Tool creation pattern:**
```python
from langchain.tools import tool

@tool
def my_tool(input: str) -> str:
    """Clear description the LLM will read to decide when to call this."""
    return result
```

**Complexity ladder**:
1. Single `ChatOpenAI` call
2. `create_react_agent` + `AgentExecutor`
3. LCEL chains (`prompt | model | output_parser`)
4. `StateGraph` with conditional edges
5. Multi-agent `StateGraph` nodes

**Installation:**
```bash
pip install langchain langchain-openai langchain-community langgraph
```

---

## General Guidelines

- Prefer well-established libraries over custom implementations.
- Write tests for all new functionality.
- Document public APIs and non-obvious logic.
- Follow the principle of least privilege for credentials and permissions.
- Review security implications before deploying any AI agent to production.
