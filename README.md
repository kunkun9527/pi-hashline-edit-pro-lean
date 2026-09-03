# pi-hashline-edit-pro-lean

[简体中文](README.zh-CN.md)

A token-lean Pi wrapper around [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro). It pins the complete upstream `3.0.1` runtime while shortening persistent provider-facing tool text.

## What it keeps

- Four-character Hashline anchors and served-anchor validation.
- Safe `replace` and `insert` operations, plus per-file undo.
- Opt-in anchored ripgrep results.
- Hash store, automatic reads, file checks, write-echo protection, and upstream session hooks.
- The upstream runtime and schemas rather than a reduced reimplementation.
- Optional compatibility with the local `@local/pi-collapsed-tools.display-service.v1` decorator.

## Why it is lean

Only model-facing prose is trimmed: concise descriptions and critical usage rules replace upstream prompt text, parameter descriptions are removed, and no prompt resources are added. Runtime behavior, validation, error contracts, and tool schemas remain upstream-compatible.

## Install

```bash
pi install git:github.com/kunkun9527/pi-hashline-edit-pro-lean
```

Do not load another Hashline wrapper at the same time, or tools may be registered twice.

## Tools

```text
read
replace
insert
undo_last_change
anchor_grep        # registered but disabled by default
```

Use `/toggle-anchor-grep` to switch between Pi's built-in `grep` and `anchor_grep`. Use `/toggle-auto-read` to control automatic anchors after writes and post-edit diffs.

Always copy the four-character anchors returned by `read` or `anchor_grep`. Never invent anchors. `replace` now accepts `replacement_lines: string[]`; `[]` deletes the selected range and `[""]` creates one blank line.

## Breaking changes from the previous lean release

This release follows upstream `3.0.1`, whose editing contract is intentionally incompatible with `2.5.2`:

- Anchors changed from three to four characters.
- `replacement_text` became `replacement_lines`.
- `undo_last_replace` became `undo_last_change`.
- `insert` and optional `anchor_grep` were added.

Legacy aliases are not emulated because doing so would bypass or weaken the current upstream contract. Start a fresh Pi session after upgrading so the model receives the new schemas and instructions.

## Context footprint

The recurring provider-facing tool contribution was measured against the pinned upstream `3.0.1` runtime:

| Active configuration | Lean | Upstream | Saved |
| --- | ---: | ---: | ---: |
| Default: `read`, `replace`, `insert`, `undo_last_change` | **485 tokens** | 1,358 tokens | **873 (64.3%)** |
| With optional `anchor_grep` enabled | **617 tokens** | 1,846 tokens | **1,229 (66.6%)** |

Per-tool estimates:

| Tool | Lean | Upstream | Saved |
| --- | ---: | ---: | ---: |
| `read` | 84 | 276 | 192 (69.6%) |
| `replace` | 163 | 534 | 371 (69.5%) |
| `insert` | 159 | 345 | 186 (53.9%) |
| `undo_last_change` | 79 | 203 | 124 (61.1%) |
| `anchor_grep` | 132 | 488 | 356 (73.0%) |

Method: two identical runs in isolated fresh sessions using Pi `0.84.4` and `pi-context-view` `0.5.0`. The session lifecycle was bound before measuring, so default-disabled `anchor_grep` is excluded from the default total. Estimates use Context View's `ceil(characters / 4)` calculation over active tool descriptions, JSON schemas, prompt snippets, and guidelines. Pi's base prompt, built-in tools, skills, context files, messages, unrelated extensions, runtime-only UI, and slash commands are excluded.

## Versions

- Lean wrapper: `3.0.1-lean.1`
- Upstream runtime: `pi-hashline-edit-pro@3.0.1`
- Node.js: `>=22.19.0`

## Development

```bash
npm ci
npm run check
```

## License and upstream

MIT. This project wraps the MIT-licensed [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro).
