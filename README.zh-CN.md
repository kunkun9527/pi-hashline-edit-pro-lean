# pi-hashline-edit-pro-lean

[English](README.md)

[`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro) 的 Token 精简版 Pi 包装层。当前固定使用完整的上游 `4.3.5` 运行时，只精简长期进入模型上下文的工具文本。

## 保留的能力

- 四字符 Hashline 锚点与已提供锚点校验。
- 安全的 anchor-only `replace`、`insert`（默认不传 `path`）和按文件撤销。
- 返回锚点的 ripgrep 搜索，默认启用。
- Hash store、自动读取、文件检查、write 锚点回显防护和上游 session hooks。
- 直接复用上游运行时与 Schema，不缩减或重写安全协议。
- 兼容本地 `@local/pi-collapsed-tools.display-service.v1` 折叠展示装饰器。

## 为什么更精简

只裁剪模型可见文本：用简短描述和关键规则替代上游长 Prompt，删除重复的参数字段说明，也不额外加载 Prompt 资源。运行行为、校验、错误契约和工具 Schema 均与上游保持一致。

## 安装

```bash
pi install git:github.com/kunkun9527/pi-hashline-edit-pro-lean
```

请勿同时加载其它 Hashline 包装扩展，以免重复注册工具。

## 工具

```text
read
replace            # anchor-only：默认不传 path
insert             # anchor-only：默认不传 path
undo_last_change   # 仍需要 path
anchor_grep        # 默认启用
```

使用 `/hashline-config` 改设置（自动读取、path 模式、严格输入、diff 行数），`/clear-anchors` 清除本会话的锚点声明。旧的 `toggle-auto-read` / `toggle-anchor-grep` 已随上游 4.x 移除。

必须复制 `read` 或 `anchor_grep` 返回的四字符锚点，绝不要猜测。`replace` 使用 `replacement_lines: string[]`：`[]` 表示删除所选范围，`[""]` 表示写入一个空行。同一条消息里对同一文件的 `replace`/`insert` 会合并成一个 batch，共用一个 diff 和一次撤销。

## 相比旧版 lean 的破坏性变化

本版本跟随上游 `4.3.5`，其编辑契约与 `3.0.4` 有意不兼容：

- `replace` / `insert` 改为 anchor-only：默认不传 `path`（可用 require-path 模式改回）。
- 同一条消息里对同一文件的调用会合并成一个 batch，每个文件一个撤销。
- `toggle-auto-read` / `toggle-anchor-grep` 被 `/hashline-config` 和 `/clear-anchors` 取代。
- `anchor_grep` 默认启用。

升级后请新建 Pi 会话，确保模型获得新的 Schema 与使用说明。

## 上下文占用

<!-- token-benchmark:benchmark:start -->
针对上游 `pi-hashline-edit-pro@4.3.5`，实测结果如下：

| 配置 | Lean | 上游 | 节省 |
| --- | ---: | ---: | ---: |
| 默认 | **537** | 1,934 | **1,397（72.2%）** |
| 启用 anchor_grep | **537** | 1,934 | **1,397（72.2%）** |

- **默认 Lean：**`read` (86) + `replace` (147) + `insert` (125) + `anchor_grep` (116) + `undo_last_change` (63)
- **默认 上游：**`read` (272) + `replace` (629) + `insert` (388) + `anchor_grep` (424) + `undo_last_change` (221)
- **启用 anchor_grep Lean：**`read` (86) + `replace` (147) + `insert` (125) + `anchor_grep` (116) + `undo_last_change` (63)
- **启用 anchor_grep 上游：**`read` (272) + `replace` (629) + `insert` (388) + `anchor_grep` (424) + `undo_last_change` (221)

测量环境为 Pi 0.85.1 的独立临时进程、空白工作目录与空白配置。排除内置工具、Skills、上下文文件、会话历史、用户消息、无关扩展、运行时 UI 与 Slash Commands；计入扩展的 `before_agent_start` 注入。Token 是按 `ceil(字符数 / 4)` 计算的固定字符代理估算，并非模型 tokenizer 实际计费值。
<!-- token-benchmark:benchmark:end -->

## 版本

- Lean 包装层：`4.3.5-lean.1`
- 上游运行时：`pi-hashline-edit-pro@4.3.5`
- Node.js：`>=22.19.0`

## 本地开发

```bash
npm ci
npm run check
```

## 开源协议与上游

MIT。本项目包装了采用 MIT 许可证的 [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro)。
