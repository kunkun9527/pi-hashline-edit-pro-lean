# pi-hashline-edit-pro-lean

[简体中文](README.zh-CN.md)

A token-lean Pi wrapper around [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro). It pins the complete upstream `4.3.5` runtime while shortening persistent provider-facing tool text.

## What it keeps

- Four-character Hashline anchors and served-anchor validation.
- Safe anchor-only `replace` and `insert` operations (no `path` by default), plus per-file undo.
- Opt-in anchored ripgrep results, enabled by default.
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
replace            # anchor-only: no path by default
insert             # anchor-only: no path by default
undo_last_change   # still requires path
anchor_grep        # enabled by default
```

Use `/hashline-config` to change settings (auto-read, require-path mode, strict input, diff context) and `/clear-anchors` to drop the session's anchor claims. The old `toggle-auto-read` / `toggle-anchor-grep` commands are gone with upstream 4.x.

Always copy the four-character anchors returned by `read` or `anchor_grep`. Never invent anchors. `replace` takes `replacement_lines: string[]`; `[]` deletes the selected range and `[""]` creates one blank line. Same-file `replace`/`insert` calls in one message form one batch with a combined diff and a single undo.

## Breaking changes from the previous lean release

This release follows upstream `4.3.5`, whose editing contract is intentionally incompatible with `3.0.4`:

- `replace` and `insert` are anchor-only: no `path` by default (opt back in with require-path mode).
- Same-file calls in one message form one batch per file, with one undo for the whole batch.
- `toggle-auto-read` / `toggle-anchor-grep` are replaced by `/hashline-config` and `/clear-anchors`.
- `anchor_grep` is enabled by default.

Start a fresh Pi session after upgrading so the model receives the new schemas and instructions.

## Context footprint

<!-- token-benchmark:benchmark:start -->
Measured against upstream `pi-hashline-edit-pro@4.3.5`:

| Configuration | Lean | Upstream | Saved |
| --- | ---: | ---: | ---: |
| Default | **537** | 1,934 | **1,397 (72.2%)** |
| With anchor_grep | **537** | 1,934 | **1,397 (72.2%)** |

- **Default Lean:** `read` (86) + `replace` (147) + `insert` (125) + `anchor_grep` (116) + `undo_last_change` (63)
- **Default upstream:** `read` (272) + `replace` (629) + `insert` (388) + `anchor_grep` (424) + `undo_last_change` (221)
- **With anchor_grep Lean:** `read` (86) + `replace` (147) + `insert` (125) + `anchor_grep` (116) + `undo_last_change` (63)
- **With anchor_grep upstream:** `read` (272) + `replace` (629) + `insert` (388) + `anchor_grep` (424) + `undo_last_change` (221)

Measured with Pi 0.85.1 in separate temporary processes with empty working directories and configuration. Built-in tools, skills, context files, session history, user messages, unrelated extensions, runtime UI, and slash commands are excluded; `before_agent_start` additions are included. Tokens are a fixed character-proxy estimate using `ceil(characters / 4)`, not provider tokenizer billing.
<!-- token-benchmark:benchmark:end -->
## Versions

- Lean wrapper: `4.3.5-lean.1`
- Upstream runtime: `pi-hashline-edit-pro@4.3.5`
- Node.js: `>=22.19.0`

## Development

```bash
npm ci
npm run check
```

## License and upstream

MIT. This project wraps the MIT-licensed [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro).
