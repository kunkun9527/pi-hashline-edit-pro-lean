# pi-hashline-edit-pro-lean

[中文](#中文) · [English](#english)

## 中文

`pi-hashline-edit-pro-lean` 是 [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro) 的轻量 Pi 包装层。它保留 Hashline 的读取、替换、撤销、hash store、自动读取和 session hooks，只缩短模型可见的工具描述与提示文本。

### 模型可见工具

- `read`
- `replace`
- `undo_last_replace`

### 安装

```bash
pi install git:github.com/kunkun9527/pi-hashline-edit-pro-lean
```

不要和原版 Hashline wrapper 同时加载，以免重复注册编辑工具。

### 开发

```bash
npm ci
npm run check
```

上游依赖固定为 `pi-hashline-edit-pro@2.5.2`。请遵循 `read` 返回的 HASH 锚点规则；不要猜测锚点。

## English

`pi-hashline-edit-pro-lean` is a small Pi wrapper around [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro). It preserves Hashline read, replace, undo, hash-store, auto-read, and session-hook behavior while shortening model-facing tool descriptions and prompt text.

It exposes `read`, `replace`, and `undo_last_replace`.

Install:

```bash
pi install git:github.com/kunkun9527/pi-hashline-edit-pro-lean
```

Do not load another Hashline wrapper at the same time, or the editing tools may be registered twice.

Validate locally with `npm ci && npm run check`. Always use HASH anchors returned by `read`; never invent them.

## License

MIT. This project is a wrapper around the MIT-licensed `pi-hashline-edit-pro` project.
