# LLM and Alarm Evals

## Goal Decomposer Eval

Run:

```bash
npm run eval:goal-decomposer
```

This validates:

- Schema validity rate
- Implementation intention coverage
- Two-minute start coverage
- Provider fallback reliability

## Alarm Engine Eval

Run:

```bash
npm run eval:alarm-engine
```

This validates:

- Notification fire reliability `>= 0.99`
- Escalation timing accuracy (within `+/- 10s`) `>= 0.99`
- One-snooze enforcement `= 1.00`
- Ack logging completeness `= 1.00`
- Duplicate delivery rate `<= 0.001`
- User-language label overlap `>= 0.95`
- Restart recovery success `= 1.00`
- Idle CPU `< 1%`

## Recommended Local Run Order

```bash
cargo test --manifest-path src-tauri/Cargo.toml
npm test
npm run eval:goal-decomposer
npm run eval:alarm-engine
```
