# pi-hashline-edit-pro-lean

[简体中文](README.zh-CN.md)

A lightweight Pi wrapper for [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro). It maintains Hashline's line-anchor safety model while stripping verbose descriptions from the prompt.

## Core Features

* Safe anchored editing: Reads files with HASH line anchors and performs precise line-safe replacements.
* Instant rollback: Supports one-step undo for the most recent edit.
* Complete runtime integrity: Preserves hash caching, anchor validation, automatic re-reads, file checks, and session hooks.
* Lean prompt footprint: Retains original parameter schemas while removing unnecessary prompt verbiage and unused resources.

## Installation

```bash
pi install git:github.com/kunkun9527/pi-hashline-edit-pro-lean
```

Do not load this alongside another Hashline wrapper to avoid registering duplicate editing tools.

## Usage

The model interacts with three tools:

```text
read
replace
undo_last_replace
```

Always use the three-character HASH anchors returned by `read`. Never guess anchors, and re-read the file if it has changed before performing subsequent replacements.

## Context Footprint Benchmark

With only this extension enabled, its recurring initialization overhead in the model context is:

| Tool | Lean | Upstream `pi-hashline-edit-pro@2.5.2` |
| --- | ---: | ---: |
| `read` | 85 | 247 |
| `replace` | 203 | 948 |
| `undo_last_replace` | 63 | 215 |
| **Total** | **351** | **1,410** |

This saves **1,059 tokens (75.1%)** compared to the pinned upstream package.

The benchmark was measured on Pi 0.84.4 with `pi-context-view@0.4.3` in a fresh isolated session, with built-in editing tools disabled and skills, context files, and unrelated extensions excluded. Context View estimates tokens as `ceil(characters / 4)`. Pure runtime UI elements and slash commands are excluded as they are not sent to the model.

## Versions

Upstream runtime is pinned to `pi-hashline-edit-pro@2.5.2`.

## Development

```bash
npm ci
npm run check
```

## License

MIT. This project wraps the MIT-licensed [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro).