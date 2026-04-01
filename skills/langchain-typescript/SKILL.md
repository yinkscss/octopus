---
name: langchain-typescript
description: Build AI agents and applications using LangChain and LangGraph in TypeScript. Use when building conversational AI, RAG systems, tool-using agents, multi-agent workflows, or any LLM-powered application. Covers agents (ReAct pattern), LangGraph (complex orchestration with state management), models (OpenAI, Anthropic, etc.), tools (custom and built-in), chains (LCEL), memory systems, deployment, and complete working examples.
source: https://github.com/yinkscss/skills/tree/main/skills/langchain-typescript
license: MIT
---

# LangChain & LangGraph TypeScript

Build production-ready AI agents and LLM applications with LangChain and LangGraph in TypeScript.

## Overview

LangChain is a framework for developing applications powered by language models. It provides a standard interface for:
- **Agents**: Autonomous decision-making with tool use
- **Chains**: Composable sequences of operations
- **Models**: Unified interface for LLMs (OpenAI, Anthropic, etc.)
- **Tools**: Extend capabilities with external integrations
- **Memory**: Maintain conversation context

LangGraph extends LangChain for complex workflows with graph-based orchestration, state management, and human-in-the-loop support.

## When to Use

**Use LangChain when:**
- Building conversational AI or chatbots
- Creating agents that use tools (search, calculator, API calls)
- Implementing RAG (Retrieval-Augmented Generation) for Q&A
- Composing multi-step LLM workflows
- Integrating multiple LLMs or switching providers

**Use LangGraph when:**
- Workflows need conditional branching or loops
- Multiple agents collaborate
- State must persist across steps
- Human approval is required
- Complex error handling with retries

## Quick Start

### Simple Agent (10 Lines)

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";

const model = new ChatOpenAI({ model: "gpt-4" });
const tools = [new DuckDuckGoSearch()];
const agent = createReactAgent({ llm: model, tools });

const result = await agent.invoke({
  messages: [{ role: "user", content: "What's the weather in NYC?" }]
});
```

### Installation

```bash
npm install @langchain/core @langchain/openai @langchain/langgraph langchain
```

## Core Capabilities

### 1. Agents

Agents use LLMs to decide which actions to take.

**Common patterns:**
- Research agent with search tools
- Customer support agent with database access
- Coding agent with execution capabilities

### 2. LangGraph

Build complex multi-step workflows with graph-based orchestration.

**Use when:**
- Your workflow has more than 5 steps
- You need branching logic or loops
- Multiple agents need to collaborate
- Human approval is required

### 3. Models

Unified interface for all major LLM providers.

**Providers supported:**
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3.5)
- Google (Gemini)
- Azure OpenAI

### 4. Tools

Extend agent capabilities with custom and built-in tools.

### 5. Chains

Compose LLM operations with LCEL (LangChain Expression Language).

```typescript
const chain = prompt.pipe(model).pipe(outputParser);
const result = await chain.invoke({ input: "..." });
```

### 6. Memory & State

Maintain context across interactions.

- Buffer memory (store all messages)
- Window memory (keep last N messages)
- Summary memory (summarize old context)
- Vector store memory (semantic search over history)

### 7. Deployment & Production

- LangSmith integration (tracing, evaluation)
- Next.js and Express.js deployment
- Docker and containerization
- Monitoring, logging, and error tracking

## Common Patterns

### Pattern 1: Agent with Tools

```typescript
const agent = createReactAgent({
  llm: model,
  tools: [searchTool, calculatorTool, customTool],
  messageModifier: "You are a helpful assistant."
});
```

### Pattern 2: RAG for Q&A

```typescript
const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
const retriever = vectorStore.asRetriever();
const chain = await createRetrievalChain({ retriever, combineDocsChain });
```

### Pattern 3: Graph with Conditional Logic

```typescript
const graph = new StateGraph(state)
  .addNode("step1", node1)
  .addNode("step2", node2)
  .addConditionalEdges("step1", router, { continue: "step2", end: END });
```

### Pattern 4: Multi-Agent Collaboration

```typescript
const researcher = createReactAgent({ llm, tools: [search] });
const writer = createReactAgent({ llm, tools: [] });
const graph = new StateGraph(state)
  .addNode("research", researcher)
  .addNode("write", writer);
```

## Best Practices

1. **Start Simple**: Use basic agents before LangGraph
2. **Use Types**: Leverage TypeScript for type safety
3. **Handle Errors**: Wrap calls in try-catch
4. **Stream Responses**: Better UX for long operations
5. **Monitor Costs**: Track token usage
6. **Cache Results**: Avoid redundant API calls
7. **Use LangSmith**: Production tracing and debugging
8. **Test Thoroughly**: Unit and integration tests

## Environment Setup

```bash
# Model providers (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# LangSmith (optional but recommended)
LANGSMITH_API_KEY=...
LANGSMITH_TRACING_V2=true
LANGSMITH_PROJECT=my-project
```

## Decision Tree

```
Start: What are you building?
│
├─ Simple Q&A or chatbot?
│  └─ Use: Simple Agent + Memory
│
├─ Search/analyze documents?
│  └─ Use: RAG Application
│
├─ Agent needs tools (search, calculator, API)?
│  └─ Use: Simple Agent + Custom Tools
│
├─ Multi-step workflow with branching?
│  └─ Use: LangGraph Agent
│
├─ Multiple agents working together?
│  └─ Use: LangGraph + Multi-Agent Pattern
│
└─ Need human approval in workflow?
   └─ Use: LangGraph with Human-in-the-Loop
```

## Complexity Ladder

1. **Level 1**: Single LLM call with `ChatOpenAI`
2. **Level 2**: Simple Agent with a few tools
3. **Level 3**: Chains — Multi-step processing, RAG
4. **Level 4**: LangGraph — Conditional logic, loops, state
5. **Level 5**: Multi-Agent — Specialized agents, human-in-the-loop

## Troubleshooting

### Agent Not Using Tools
- Check tool descriptions are clear
- Ensure model supports function calling (GPT-4, Claude)

### Memory Not Persisting
- Verify checkpointer is configured
- Use same `thread_id` for conversations

### High API Costs
- Use cheaper models (GPT-3.5 vs GPT-4)
- Implement caching
- Reduce `maxTokens`

## Additional Resources

- **Official Docs**: https://js.langchain.com/
- **LangGraph Docs**: https://langchain-ai.github.io/langgraphjs/
- **LangSmith**: https://smith.langchain.com/
- **Examples Repo**: https://github.com/langchain-ai/langchainjs
