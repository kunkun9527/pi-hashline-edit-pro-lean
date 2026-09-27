# pi-hashline-edit-pro-lean

[English](README.md)

[`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro) 的 Token 精简版 Pi 包装层。当前固定使用完整的上游 `4.4.3` 运行时，只精简长期进入模型上下文的工具文本。

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

## 上游 4.4 的行为变化

- 去掉了边界行自动去重：`replacement_lines` 按原样写入。如果重复写了范围外紧挨着的那一行，它会出现两次。
- 同一文件的一批编辑里，某条调用的锚点找不到时，只有这一条失败，其余照常写入。
- 新增的错误码会说明下一步怎么做：`E_RANGE_STALE` 会返回新锚点供重试，`E_BATCH_OVERLAP` 表示两条调用改到了同一行，`E_OP_ABORTED` 表示同批的另一条失败或文件已被改动。
- `/hashline-config` 里去掉了去重选项。

## 相比 3.x 的破坏性变化

4.x 的编辑契约与 `3.0.4` 有意不兼容：

- `replace` / `insert` 改为 anchor-only：默认不传 `path`（可用 require-path 模式改回）。
- 同一条消息里对同一文件的调用会合并成一个 batch，每个文件一个撤销。
- `toggle-auto-read` / `toggle-anchor-grep` 被 `/hashline-config` 和 `/clear-anchors` 取代。
- `anchor_grep` 默认启用。

升级后请新建 Pi 会话，确保模型获得新的 Schema 与使用说明。

## 上下文占用

<!-- token-benchmark:benchmark:start -->
针对上游 `pi-hashline-edit-pro@4.4.3`，实测结果如下：

| 配置 | Lean | 上游 | 节省 |
| --- | ---: | ---: | ---: |
| 默认 | **537** | 2,040 | **1,503（73.7%）** |
| 启用 anchor_grep | **537** | 2,040 | **1,503（73.7%）** |

- **默认 Lean：**`read` (86) + `replace` (147) + `insert` (125) + `anchor_grep` (116) + `undo_last_change` (63)
- **默认 上游：**`read` (276) + `replace` (740) + `insert` (379) + `anchor_grep` (424) + `undo_last_change` (221)
- **启用 anchor_grep Lean：**`read` (86) + `replace` (147) + `insert` (125) + `anchor_grep` (116) + `undo_last_change` (63)
- **启用 anchor_grep 上游：**`read` (276) + `replace` (740) + `insert` (379) + `anchor_grep` (424) + `undo_last_change` (221)

测量环境为 Pi 0.87.1 的独立临时进程、空白工作目录与空白配置。排除内置工具、Skills、上下文文件、会话历史、用户消息、无关扩展、运行时 UI 与 Slash Commands；计入扩展的 `before_agent_start` 注入。Token 是按 `ceil(字符数 / 4)` 计算的固定字符代理估算，并非模型 tokenizer 实际计费值。
<!-- token-benchmark:benchmark:end -->

## 版本

- Lean 包装层：`4.4.3-lean.1`
- 上游运行时：`pi-hashline-edit-pro@4.4.3`
- Node.js：`>=22.19.0`

## 本地开发

```bash
npm ci
npm run check
```

## 开源协议与上游

MIT。本项目包装了采用 MIT 许可证的 [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro)。
