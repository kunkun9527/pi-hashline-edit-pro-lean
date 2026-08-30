# pi-hashline-edit-pro-lean

[简体中文](README.zh-CN.md)

A token-lean Pi wrapper around [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro). It preserves Hashline's editing safety model while shortening persistent provider-facing descriptions.

## What it keeps

- HASH-anchored file reads and line-safe replacements.
- Undo for the latest replacement.
- Hash store, served-anchor validation, automatic reads, file checks, and session hooks.
- The upstream editing runtime rather than a reduced reimplementation.

## Why it is lean

The wrapper exposes concise descriptions and critical editing rules for three tools instead of the upstream's longer provider-facing text. Parameter names retain their original schema; repetitive field prose and unused prompt resources are omitted.

## Install

```bash
pi install git:github.com/kunkun9527/pi-hashline-edit-pro-lean
```

Do not load another Hashline wrapper at the same time, or the editing tools may be registered twice.

## Use

Model-facing tools:

```text
read
replace
undo_last_replace
```

Always copy the three-character HASH anchors returned by `read`. Never invent anchors, and re-read a file after it changes before making another replacement.

## Measured initialization footprint

With only this extension enabled, its recurring model-facing initialization contribution is:

| Tool | Lean | Upstream `pi-hashline-edit-pro@2.5.2` |
| --- | ---: | ---: |
| `read` | 85 | 247 |
| `replace` | 203 | 948 |
| `undo_last_replace` | 63 | 215 |
| **Total** | **351** | **1,410** |

That is **1,059 fewer tokens (75.1%)** than the pinned upstream extension. The measurement used Pi 0.84.4 and `pi-context-view@0.4.3` in a fresh isolated session, with Pi's built-in editing tools disabled and skills, context files, messages, and unrelated extensions excluded. Context View estimates text as `ceil(characters / 4)`, so these are reproducible context-footprint estimates rather than exact GPT tokenizer counts. Runtime-only UI and slash commands are not included because they are not sent to the model.

## Versions

The upstream runtime is pinned to `pi-hashline-edit-pro@2.5.2`.

## Development

```bash
npm ci
npm run check
```

## License and upstream

MIT. This project wraps the MIT-licensed [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro).