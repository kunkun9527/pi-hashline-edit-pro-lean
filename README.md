<div align="center">

# pi-hashline-edit-pro-lean

**Anchor-based file editing for Pi, just as safe, with a much shorter tool prompt.**

[简体中文](https://github.com/kunkun9527/pi-hashline-edit-pro-lean/blob/main/README_zh-CN.md) · Full setup: [My Lean Pi Setup](https://github.com/kunkun9527/my-lean-pi-setup)

</div>

<!-- token-benchmark:summary:start -->
> **Always-on context: 1,282 tokens vs. 4,732 for upstream `pi-hashline-edit-pro@6.4.6`, 72.9% less.**
<!-- token-benchmark:summary:end -->

A lean version of [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro). It runs the upstream `6.4.6` runtime as-is; I only condensed the tool prompt the model reads on every turn.

## Install

```bash
pi install git:github.com/kunkun9527/pi-hashline-edit-pro-lean
```

Requires Pi `>=0.99.0` and Node.js `>=22.19.0`. Don't install it alongside upstream or another Hashline wrapper, or the tools get registered twice.

## Compared with upstream

**Kept**:

- Four-character Hashline anchors and validation of served anchors.
- Anchor-only `replace`, `replace_match`, `insert`, `copy` and `move` (no `path` by default), plus per-file undo.
- Anchored ripgrep search under the name `grep`, on by default.
- Hash store, automatic reads, file checks, write-echo protection and upstream's session hooks.
- Upstream's runtime, schemas and tool switches, with no safety mechanism cut or rewritten.

**Trimmed**: only text the model sees, every line a condensed version of upstream's own wording, with no rules of my own.

- Each rule is said once. Most parameter descriptions are gone; upstream's text stays only for range bounds, copy's source and destination (move takes the same fields), and `text`.
- Rules upstream already enforces with an error that names the fix (unread lines in a range, overlapping ranges in a batch, stale anchors, path not matching the anchor) are left to that error.
- Rules whose violation would silently produce a wrong edit, or lose something no error can give back, are kept: the `anchor│content` row format, decoding escapes once, batch and single-slot undo, append and deletion semantics.
- Lines upstream shows only under some settings still follow those settings; the "which tool to prefer" line upstream repeats on every tool is kept once, on `read`.

**Added**:

- **Forgiving arguments**: before validation, `replace` accepts the retired `replacement_text` / `replacement_lines` as `text`, `insert` accepts `lines` as `text`, and a `ref` equal to `path` is dropped. Anything ambiguous (such as a missing `remove_to`, `path` or anchor) still fails validation.
- **Collapsed display**: works with the local `@local/pi-collapsed-tools.display-service.v1` decorator.

## Usage

```text
read
replace            # anchor-only, no path by default
replace_match      # exact substring inside an anchored range
insert             # anchor-only, no path by default
copy / move        # anchored line ranges, same or another file
grep               # anchored ripgrep; replaces Pi's built-in grep
undo_last_change   # still requires path
```

- Always copy anchors from `read` or `grep` results; never make them up.
- `replace` and `insert` take one exact `text` string; line breaks inside it separate lines, and `text: ""` in `replace` deletes the selected range.
- Same-file edits in one message form one batch, with a combined diff and a single undo.

## Configuration

Settings live in `~/.config/pi-hashline-edit-pro/config.json` (or `$PI_HASHLINE_DIR/config.json`), shared with upstream. Change them with `/hashline-config`.

Defaults are upstream's: all eight tools on. Versions up to `6.4.5-lean.2` wrote `replaceMatchEnabled: false` into the config on load (older ones also `copyMoveEnabled: false`), and those values survive an upgrade. Turn the tools back on in `/hashline-config`, or set:

```json
{
  "copyMoveEnabled": true,
  "replaceMatchEnabled": true
}
```

Two upstream settings swap in Pi's plain tools: `anchorGrepEnabled: false` registers the built-in `grep`, and a model matched by `disableOnModels` gets the built-in `read` and `grep` with the edit tools off. Those plain tools keep Pi's own text.

## Upgrading from 4.x

- `replacement_lines` / `lines` arrays became the `text` string; `[]` becomes `""`.
- `anchor_grep` is now `grep` and replaces Pi's built-in `grep`.
- New `replace_match`, `copy` and `move` tools, on by default and switchable in `/hashline-config`.
- A pure deletion verifies its boundary lines; interior lines that were never served are removed as they currently stand on disk.

Start a fresh Pi session after upgrading so the model gets the new schemas and instructions.

## Token comparison

<!-- token-benchmark:benchmark:start -->
With only this extension enabled, what the model reads on every turn:

| Variant | Breakdown | Total |
| --- | --- | ---: |
| Lean `pi-hashline-edit-pro-lean@6.4.6-lean.3` | `read` (147) + `grep` (146) + `replace` (254) + `replace_match` (195) + `insert` (131) + `copy` (216) + `move` (99) + `undo_last_change` (94) | **1,282** |
| Upstream `pi-hashline-edit-pro@6.4.6` | `read` (388) + `grep` (514) + `replace` (644) + `replace_match` (953) + `insert` (524) + `copy` (731) + `move` (707) + `undo_last_change` (271) | **4,732** |

That is **3,450 tokens (72.9%)** less.

<sub>Method: Pi 1.2.0, each variant measured in its own temporary process with an empty working directory and configuration. Built-in tools, skills, context files, session history, user messages, other extensions, runtime UI and slash commands are not counted; `before_agent_start` additions are. Tokens are estimated as `ceil(characters / 4)`, not billed tokens.</sub>
<!-- token-benchmark:benchmark:end -->

## Development

```bash
npm ci
npm run check
```

## License

MIT. The runtime comes from [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro) by [@YuGiMob](https://github.com/YuGiMob) (MIT).
