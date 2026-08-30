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

## Versions

The upstream runtime is pinned to `pi-hashline-edit-pro@2.5.2`.

## Development

```bash
npm ci
npm run check
```

## License and upstream

MIT. This project wraps the MIT-licensed [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro).