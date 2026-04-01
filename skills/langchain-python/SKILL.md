---
name: langchain-python
description: Build AI agents and applications using LangChain and LangGraph in Python. Use when building conversational AI, RAG systems, tool-using agents, multi-agent workflows, or any LLM-powered application. Covers agents (ReAct pattern, tool use), LangGraph (complex orchestration with state management, conditional routing, persistence), models (OpenAI, Anthropic, Google, etc.), tools (custom and built-in), chains (LCEL, retrieval, conversation), memory systems, RAG (document loading, embeddings, vector stores, retrieval strategies), deployment (LangSmith, FastAPI, Docker), and complete working examples.
source: https://github.com/yinkscss/skills/tree/main/skills/langchain-python
license: MIT
---

# LangChain & LangGraph Python

Build production-ready AI agents and LLM applications with LangChain and LangGraph in Python.

## Overview

LangChain is a framework for developing applications powered by language models. It provides a standard interface for:
- **Agents**: Autonomous decision-making with tool use
- **Chains**: Composable sequences of operations
- **Models**: Unified interface for LLMs (OpenAI, Anthropic, etc.)
- **Tools**: Extend capabilities with external integrations
- **Memory**: Maintain conversation context

LangGraph extends LangChain for complex workflows with graph-based orchestration, state management, and human-in-the-loop support.

## Quick Start

### Simple Agent (10 Lines)

```python
from langchain_openai import ChatOpenAI
from langchain.agents import create_react_agent, AgentExecutor
from langchain.tools import tool
from langchain import hub

@tool
def search(query: str) -> str:
    """Search for information."""
    return f"Results for: {query}"

llm = ChatOpenAI(model="gpt-4")
agent = create_react_agent(llm, [search], hub.pull("hwchase17/react"))
executor = AgentExecutor(agent=agent, tools=[search])
result = executor.invoke({"input": "What's the weather in NYC?"})
```

### Installation

```bash
pip install langchain langchain-openai langchain-community langgraph
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
- Error recovery is critical

### 3. Models

Unified interface for all major LLM providers.

**Providers supported:**
- OpenAI (GPT-4, GPT-3.5, GPT-4o)
- Anthropic (Claude 3.5, Claude 3 Opus)
- Google (Gemini Pro, Gemini Vision)
- Ollama (local models)

### 4. Tools

Extend agent capabilities with custom and built-in tools.

```python
from langchain.tools import tool

@tool
def my_tool(input: str) -> str:
    """Tool description for the LLM."""
    return f"Result: {input}"
```

### 5. Chains

Compose LLM operations with LCEL (LangChain Expression Language).

```python
from langchain.schema.runnable import RunnablePassthrough

chain = prompt | model | output_parser
result = chain.invoke({"input": "..."})
```

### 6. Memory & State

Maintain context across interactions.

- Buffer memory (store all messages)
- Window memory (keep last N messages)
- Summary memory (summarize old context)
- Token buffer memory (limit by tokens)
- Entity memory (track facts about entities)
- Vector store memory (semantic search)

### 7. RAG (Retrieval-Augmented Generation)

```python
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain

retriever = vectorstore.as_retriever()
combine_docs_chain = create_stuff_documents_chain(llm, prompt)
rag_chain = create_retrieval_chain(retriever, combine_docs_chain)
```

**Document loaders**: PDF, text, web, CSV, JSON
**Vector stores**: FAISS, Chroma, Pinecone, Weaviate
**Embeddings**: OpenAI, HuggingFace, Cohere

### 8. Deployment & Production

- LangSmith integration (tracing, evaluation, monitoring)
- FastAPI deployment patterns
- Docker and Kubernetes
- Security best practices

## Common Patterns

### Pattern 1: Agent with Tools

```python
agent = create_react_agent(
    ChatOpenAI(model="gpt-4"),
    [search_tool, calculator_tool, custom_tool],
    hub.pull("hwchase17/react")
)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
```

### Pattern 2: RAG for Q&A

```python
retriever = vectorstore.as_retriever()
combine_docs_chain = create_stuff_documents_chain(llm, prompt)
rag_chain = create_retrieval_chain(retriever, combine_docs_chain)
```

### Pattern 3: Graph with Conditional Logic

```python
from langgraph.graph import StateGraph, START, END

workflow = StateGraph(StateDict)
workflow.add_node("step1", node1)
workflow.add_node("step2", node2)
workflow.add_conditional_edges("step1", router, {
    "continue": "step2",
    "end": END
})
```

### Pattern 4: Multi-Agent Collaboration

```python
from langgraph.prebuilt import create_react_agent

researcher = create_react_agent(llm, [search], "You are a researcher")
writer = create_react_agent(llm, [], "You are a writer")

workflow = StateGraph(State)
workflow.add_node("research", researcher)
workflow.add_node("write", writer)
```

## Best Practices

1. **Start Simple**: Use basic agents before LangGraph
2. **Use Type Hints**: Leverage Python typing for clarity
3. **Handle Errors**: Wrap calls in try-except
4. **Stream Responses**: Better UX for long operations
5. **Monitor Costs**: Track token usage with callbacks
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
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__...
LANGCHAIN_PROJECT=my-project
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
- Verify model supports function calling (GPT-4, Claude)
- Use `verbose=True` to debug

### Memory Not Persisting
- Verify checkpointer is configured
- Use same `thread_id` for conversations

### High API Costs
- Use cheaper models (GPT-3.5 vs GPT-4)
- Implement caching
- Reduce `max_tokens`

## Additional Resources

- **Official Docs**: https://python.langchain.com/
- **LangGraph Docs**: https://langchain-ai.github.io/langgraph/
- **LangSmith**: https://smith.langchain.com/
- **Examples Repo**: https://github.com/langchain-ai/langchain
