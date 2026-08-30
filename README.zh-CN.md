# pi-hashline-edit-pro-lean

[English](README.md)

[`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro) 的 token 精简版 Pi 包装层。它保留 Hashline 的编辑安全模型，同时缩短长期存在于供应商请求中的描述文本。

## 保留的能力

- 使用 HASH 锚点读取文件和进行行级安全替换。
- 撤销最近一次替换。
- Hash store、已提供锚点验证、自动读取、文件检查和 session hooks。
- 使用上游编辑运行时，而不是缩减后重新实现。

## 为什么更精简

包装层为三个工具提供精简描述和关键编辑规则，替代上游更长的模型可见文本。参数名称保留原始 schema；重复字段说明和未使用的提示资源被省略。

## 安装

```bash
pi install git:github.com/kunkun9527/pi-hashline-edit-pro-lean
```

不要同时加载另一个 Hashline 包装层，否则编辑工具可能被重复注册。

## 使用

模型可见工具：

```text
read
replace
undo_last_replace
```

必须复制 `read` 返回的三字符 HASH 锚点，绝不要猜测锚点；文件发生变化后，下一次替换前要重新读取。

## 实测初始化上下文占用

仅启用本扩展时，它持续贡献给模型的初始化上下文为：

| 工具 | Lean | 上游 `pi-hashline-edit-pro@2.5.2` |
| --- | ---: | ---: |
| `read` | 85 | 247 |
| `replace` | 203 | 948 |
| `undo_last_replace` | 63 | 215 |
| **合计** | **351** | **1,410** |

相比固定版本的上游扩展，减少 **1,059 tokens（75.1%）**。测量使用 Pi 0.84.4 和 `pi-context-view@0.4.3`，在全新隔离会话中关闭 Pi 内置编辑工具，并排除 skills、context files、消息及无关扩展。Context View 按 `ceil(字符数 / 4)` 估算，因此这些是可复现的上下文占用估值，不是 GPT tokenizer 的精确计数。未计入不会发送给模型的纯运行时 UI 和 slash commands。

## 版本

上游运行时固定为 `pi-hashline-edit-pro@2.5.2`。

## 开发

```bash
npm ci
npm run check
```

## 许可证与上游

MIT。本项目包装了采用 MIT 许可证的 [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro)。