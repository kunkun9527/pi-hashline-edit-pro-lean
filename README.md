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

<!-- token-benchmark:benchmark:start -->
Measured against upstream `pi-hashline-edit-pro@3.0.4`:

| Configuration | Lean | Upstream | Saved |
| --- | ---: | ---: | ---: |
| Default | **423** | 1,503 | **1,080 (71.9%)** |
| With anchor_grep | **538** | 1,991 | **1,453 (73.0%)** |

- **Default Lean:** `read` (87) + `replace` (130) + `insert` (138) + `undo_last_change` (68)
- **Default upstream:** `read` (276) + `replace` (625) + `insert` (399) + `undo_last_change` (203)
- **With anchor_grep Lean:** `read` (87) + `replace` (130) + `insert` (138) + `anchor_grep` (115) + `undo_last_change` (68)
- **With anchor_grep upstream:** `read` (276) + `replace` (625) + `insert` (399) + `anchor_grep` (488) + `undo_last_change` (203)

Measured with Pi 0.85.1 in separate temporary processes with empty configuration. Built-in tools, skills, context files, messages, unrelated extensions, runtime UI, and slash commands are excluded. Tokens use `ceil(characters / 4)`.
<!-- token-benchmark:benchmark:end -->
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
