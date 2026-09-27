# pi-hashline-edit-pro-lean

[简体中文](README.zh-CN.md)

A token-lean Pi wrapper around [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro). It pins the complete upstream `4.4.3` runtime while shortening persistent provider-facing tool text.

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

## Behavior changes in upstream 4.4

- Boundary-line dedup is gone: `replacement_lines` are written exactly as given. If you repeat the line just outside the range, it will appear twice.
- In a same-file batch, a call whose anchors resolve nowhere now fails on its own; the rest of the batch is still written.
- New error codes tell you what to do next: `E_RANGE_STALE` returns fresh anchors to retry with, `E_BATCH_OVERLAP` means two calls share lines, `E_OP_ABORTED` means another call in the batch failed or the file changed.
- The dedup option is removed from `/hashline-config`.

## Breaking changes since 3.x

The 4.x editing contract is intentionally incompatible with `3.0.4`:

- `replace` and `insert` are anchor-only: no `path` by default (opt back in with require-path mode).
- Same-file calls in one message form one batch per file, with one undo for the whole batch.
- `toggle-auto-read` / `toggle-anchor-grep` are replaced by `/hashline-config` and `/clear-anchors`.
- `anchor_grep` is enabled by default.

Start a fresh Pi session after upgrading so the model receives the new schemas and instructions.

## Context footprint

<!-- token-benchmark:benchmark:start -->
Measured against upstream `pi-hashline-edit-pro@4.4.3`:

| Configuration | Lean | Upstream | Saved |
| --- | ---: | ---: | ---: |
| Default | **537** | 2,040 | **1,503 (73.7%)** |
| With anchor_grep | **537** | 2,040 | **1,503 (73.7%)** |

- **Default Lean:** `read` (86) + `replace` (147) + `insert` (125) + `anchor_grep` (116) + `undo_last_change` (63)
- **Default upstream:** `read` (276) + `replace` (740) + `insert` (379) + `anchor_grep` (424) + `undo_last_change` (221)
- **With anchor_grep Lean:** `read` (86) + `replace` (147) + `insert` (125) + `anchor_grep` (116) + `undo_last_change` (63)
- **With anchor_grep upstream:** `read` (276) + `replace` (740) + `insert` (379) + `anchor_grep` (424) + `undo_last_change` (221)

Measured with Pi 0.87.1 in separate temporary processes with empty working directories and configuration. Built-in tools, skills, context files, session history, user messages, unrelated extensions, runtime UI, and slash commands are excluded; `before_agent_start` additions are included. Tokens are a fixed character-proxy estimate using `ceil(characters / 4)`, not provider tokenizer billing.
<!-- token-benchmark:benchmark:end -->
## Versions

- Lean wrapper: `4.4.3-lean.1`
- Upstream runtime: `pi-hashline-edit-pro@4.4.3`
- Node.js: `>=22.19.0`

## Development

```bash
npm ci
npm run check
```

## License and upstream

MIT. This project wraps the MIT-licensed [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro).
