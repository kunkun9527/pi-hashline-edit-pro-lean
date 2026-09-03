# pi-hashline-edit-pro-lean

[English](README.md)

[`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro) 的 Token 精简版 Pi 包装层。当前固定使用完整的上游 `3.0.1` 运行时，只精简长期进入模型上下文的工具文本。

## 保留的能力

- 四字符 Hashline 锚点与已提供锚点校验。
- 安全的 `replace`、`insert` 和按文件撤销。
- 可选启用、返回锚点的 ripgrep 搜索。
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
replace
insert
undo_last_change
anchor_grep        # 已注册，但默认关闭
```

使用 `/toggle-anchor-grep` 在 Pi 内置 `grep` 与 `anchor_grep` 之间切换；使用 `/toggle-auto-read` 控制 write 后自动读取和编辑后的 diff。

必须复制 `read` 或 `anchor_grep` 返回的四字符锚点，绝不要猜测。`replace` 现在使用 `replacement_lines: string[]`：`[]` 表示删除所选范围，`[""]` 表示写入一个空行。

## 相比旧版 lean 的破坏性变化

本版本跟随上游 `3.0.1`，其编辑契约与 `2.5.2` 有意不兼容：

- 锚点由三字符改为四字符。
- `replacement_text` 改为 `replacement_lines`。
- `undo_last_replace` 改为 `undo_last_change`。
- 新增 `insert` 和可选的 `anchor_grep`。

本包装层不伪造旧名称或旧参数别名，因为那会绕过或削弱当前上游契约。升级后请新建 Pi 会话，确保模型获得新的 Schema 与使用说明。

## 上下文占用

针对固定使用的上游 `3.0.1` 运行时，实测插件长期进入模型上下文的工具定义占用如下：

| 启用配置 | Lean | 上游 | 节省 |
| --- | ---: | ---: | ---: |
| 默认：`read`、`replace`、`insert`、`undo_last_change` | **485 tokens** | 1,358 tokens | **873（64.3%）** |
| 启用可选的 `anchor_grep` | **617 tokens** | 1,846 tokens | **1,229（66.6%）** |

各工具估算：

| 工具 | Lean | 上游 | 节省 |
| --- | ---: | ---: | ---: |
| `read` | 84 | 276 | 192（69.6%） |
| `replace` | 163 | 534 | 371（69.5%） |
| `insert` | 159 | 345 | 186（53.9%） |
| `undo_last_change` | 79 | 203 | 124（61.1%） |
| `anchor_grep` | 132 | 488 | 356（73.0%） |

测量方法：使用 Pi `0.84.4` 和 `pi-context-view` `0.5.0`，在隔离的全新会话中重复测量两次，结果一致。测量前绑定完整 session 生命周期，因此默认总计不会误算默认关闭的 `anchor_grep`。按照 Context View 的 `ceil(字符数 / 4)` 方法，对已激活工具的描述、JSON Schema、Prompt snippets 和 guidelines 估算 Token；不包含 Pi Base Prompt、内置工具、Skills、上下文文件、消息、无关扩展、仅运行时 UI 和斜杠命令。

## 版本

- Lean 包装层：`3.0.1-lean.1`
- 上游运行时：`pi-hashline-edit-pro@3.0.1`
- Node.js：`>=22.19.0`

## 本地开发

```bash
npm ci
npm run check
```

## 开源协议与上游

MIT。本项目包装了采用 MIT 许可证的 [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro)。
