---
name: prompt-engineering
description: "Comprehensive guide for prompt engineering — the syntax and foundation layer of the AI Engineering Stack. Use when crafting, optimizing, or analyzing prompts for large language models. Essential for (1) Structural formatting with XML delimiters to separate instructions from data, (2) In-Context Learning via zero-shot, one-shot, and few-shot paradigms, (3) Cognitive scaffolding with Chain-of-Thought reasoning and thinking tags, (4) Meta prompting — using AI to generate and critique its own prompts, (5) Advanced techniques (self-consistency, tree of thoughts, prompt chaining, reflexion), (6) Mitigating risks like prompt injection and hallucinations, (7) Understanding model capabilities and optimising for specific tasks. For context design and RAG pipelines, see the context-engineering skill. For agent alignment and trade-off hierarchies, see the intent-engineering skill."
source: https://github.com/yinkscss/skills/tree/main/skills/prompt-engineering
license: Apache 2.0
---

# Prompt Engineering

The foundation layer ("The Syntax") of the AI Engineering Stack. Prompt engineering is the craft of manipulating the probabilistic distribution of a model's next-token generation through clear structural formatting, in-context learning, and cognitive scaffolding.

## Quick Start

### When to Use Which Technique

| Task Type | Technique |
|-----------|-----------|
| Simple tasks | Zero-shot |
| Specific format needed | Few-shot |
| Complex reasoning | Chain-of-Thought ⭐ |
| Critical decisions | Self-Consistency |
| Strategic planning | Tree of Thoughts |
| Knowledge queries | RAG |
| Tool integration | ART |
| Multi-step workflows | Prompt Chaining |
| Iterative improvement | Reflexion |
| Strategic framing | Question Stacking |
| Complex scoping | Socratic Meta-Prompt |

## Core Prompt Writing Rules

**CRITICAL: Follow these rules when writing prompts:**

1. **Use structural delimiters**: Use XML tags (`<role>`, `<context>`, `<task>`, `<format>`, `<constraints>`) to strictly separate instructions from data. This prevents prompt injection and guides model attention. Never write prompts as continuous prose.

2. **Use imperative verbs**: Start instructions with action verbs (Write, Classify, Summarize, Translate, Extract, Generate, Analyze, Compare)

3. **Be explicit and specific**: Specify exact output format, length constraints, style requirements, structural elements

4. **Structure lists hierarchically**:
   - Use consistent formatting (all dashes or all asterisks)
   - Maintain parallel structure (same grammatical form)
   - Order logically (importance, chronological, complexity)
   - Indent sub-items consistently

5. **Avoid negative instructions**: State what TO do, not what NOT to do
   - ❌ "Don't include personal information"
   - ✅ "Include only public domain information"

6. **Provide context boundaries**: Define scope, constraints, and boundaries explicitly

7. **Specify output format precisely**: markdown, JSON, plain text, structured lists, etc.

8. **Use examples strategically**: Ensure examples are representative, consistent, clear, and properly formatted

9. **Eliminate ambiguity**: Every instruction must have one clear interpretation.

## Fundamental Techniques

### Zero-Shot Prompting
Instruct the model without examples. Use for simple, well-defined tasks.

### Few-Shot Prompting
Provide 2-5 examples to guide the model's response pattern.

**Rules:**
- Use 2-5 examples (more confuses, fewer insufficient)
- Ensure examples are diverse but consistent
- Maintain consistent formatting

### Chain-of-Thought (CoT) Prompting ⭐ **MOST IMPORTANT**

LLMs don't have internal monologues. Their "thinking" only happens as they generate tokens. By forcing the model to output intermediate reasoning steps, you give it temporary working memory.

**Thinking Tags Pattern:**
```xml
<task>
IMPORTANT: Before providing your answer, work through your reasoning
step-by-step inside <thinking> tags.
</task>

<thinking>
[Model's step-by-step reasoning here]
</thinking>

**Answer:** [Final answer based on reasoning]
```

### Self-Consistency
Generate multiple reasoning paths (3-5) and select the most consistent answer.

### Tree of Thoughts (ToT)
Maintain a tree of thoughts, exploring multiple reasoning paths systematically.

## Question Stacking & Socratic Techniques

Instead of asking AI for output directly, first ask it to surface the right questions — then answer them — then execute.

**The Pattern:**
```
"What would a [expert role] ask before [doing task]?
What information would they need?
What assumptions would they validate first?
Now answer those questions for [specific context], then [execute task]."
```

## Advanced Techniques

- **Generated Knowledge Prompting**: Generate relevant background knowledge before answering
- **Least-to-Most Prompting**: Break complex tasks into simpler sub-tasks
- **Self-Refine**: Iteratively refine outputs using self-generated feedback
- **Meta Prompting**: Emphasize structural and syntactical aspects over specific content
- **Automatic Prompt Engineer (APE)**: Framework for automatic instruction generation

## Retrieval & Agent Techniques

- **RAG**: Combine information retrieval with generation
- **ART**: Combine CoT with tool use
- **Prompt Chaining**: Break tasks into subtasks
- **Reflexion**: Introduce self-evaluation and reflection

## Risk Mitigation

### Prompt Injection
**Prevention:** Validate inputs, use system prompts for boundaries, separate user content from instructions

### Hallucinations
**Mitigation:** Use RAG, request citations, cross-verify information, use self-consistency

## Prompt Writing Checklist

Before finalizing any prompt:

- [ ] Uses imperative verbs for all instructions
- [ ] Specifies exact output format
- [ ] Includes length constraints if needed
- [ ] Provides examples when helpful (2-5 for few-shot)
- [ ] Eliminates all ambiguity
- [ ] States what TO do (not what NOT to do)
- [ ] Defines scope and boundaries clearly
- [ ] Uses consistent formatting for lists

## The System Prompt "Goldilocks" Rule

- **Too vague:** Instructions like "Do a good job" provide no useful constraint
- **Too prescriptive:** Hardcoding complex if-then logic
- **The Sweet Spot:** Define desired outcomes, broad approach, and constraints

## Architectural Hierarchy

1. **Prompt (Layer 1 - Syntax):** Dictates immediate instruction following and formatting
2. **Context (Layer 2 - Information):** Knowledge infrastructure, RAG, and memory
3. **Intent (Layer 3 - Strategy):** Organisational purpose, guardrails, and business objectives

## Anti-Patterns

**Don't:**
- Use vague instructions like "make it better"
- Mix positive and negative instructions
- Provide inconsistent examples
- Assume model knows implicit context

**Do:**
- Be explicit and specific
- Use consistent formatting
- Provide clear examples
- Test prompts iteratively
