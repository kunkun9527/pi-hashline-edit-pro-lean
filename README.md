# pi-hashline-edit-pro-lean

[简体中文](README.zh-CN.md)

A token-lean Pi wrapper around [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro). It pins the complete upstream `3.0.4` runtime while shortening persistent provider-facing tool text.

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

This release follows upstream `3.0.4`, whose editing contract is intentionally incompatible with `2.5.2`:

- Anchors changed from three to four characters.
- `replacement_text` became `replacement_lines`.
- `undo_last_replace` became `undo_last_change`.
- `insert` and optional `anchor_grep` were added.

Legacy aliases are not emulated because doing so would bypass or weaken the current upstream contract. Start a fresh Pi session after upgrading so the model receives the new schemas and instructions.

## Context footprint

The recurring provider-facing tool contribution was measured against the upstream `pi-hashline-edit-pro@3.0.4` runtime:

| Active configuration | Lean | Upstream | Saved |
| --- | ---: | ---: | ---: |
| Default: `read`, `replace`, `insert`, `undo_last_change` | **423 tokens** | 1,503 tokens | **1,080 (71.9%)** |
| With optional `anchor_grep` enabled | **538 tokens** | 1,991 tokens | **1,453 (73.0%)** |

Per-tool estimates:

| Tool | Lean | Upstream | Saved |
| --- | ---: | ---: | ---: |
| `read` | 87 | 276 | 189 (68.5%) |
| `replace` | 130 | 625 | 495 (79.2%) |
| `insert` | 138 | 399 | 261 (65.4%) |
| `undo_last_change` | 68 | 203 | 135 (66.5%) |
| `anchor_grep` | 115 | 488 | 373 (76.4%) |

Method: two identical runs in isolated fresh sessions using Pi `0.84.4` and `pi-context-view` `0.5.0`. The session lifecycle was bound before measuring, so default-disabled `anchor_grep` is excluded from the default total. Estimates use Context View's `ceil(characters / 4)` calculation over active tool descriptions, JSON schemas, prompt snippets, and guidelines. Pi's base prompt, built-in tools, skills, context files, messages, unrelated extensions, runtime-only UI, and slash commands are excluded.
## Versions

- Lean wrapper: `3.0.4-lean.1`
- Upstream runtime: `pi-hashline-edit-pro@3.0.4`
- Node.js: `>=22.19.0`

## Development

```bash
npm ci
npm run check
```

## License and upstream

MIT. This project wraps the MIT-licensed [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro).
