# pi-hashline-edit-pro-lean

[English](README.md)

基于 [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro) 的精简封装。在完整保留 Hashline 行锚点安全编辑机制的同时，大幅精简工具描述，降低每次请求中的 Token 消耗。

## 核心特性

* 安全行锚点编辑：基于 3 字符 HASH 锚点读取文件并执行高精度的行级安全替换。
* 快速撤销：支持一键回滚最近一次替换修改。
* 完整保留上游逻辑：包含 Hash 缓存、已提供锚点校验、自动重新读取、文件变更检测以及会话生命周期 Hooks。
* 精简 Prompt 开销：参数字段与原始 Schema 保持一致，去除了冗余啰嗦的说明文本与未使用的 Prompt 资源。

## 安装

```bash
pi install git:github.com/kunkun9527/pi-hashline-edit-pro-lean
```

请勿与其它 Hashline 包装插件同时加载，以防重复注册编辑工具。

## 使用方法

模型可见工具包括：

```text
read
replace
undo_last_replace
```

请务必使用 `read` 返回的精确 3 字符 HASH 锚点，切勿主观猜测锚点；文件若有更新，在执行下一次替换前应重新读取。

## 初始化上下文占用对比

单独启用本插件时，注入到模型初始上下文中的 Token 占用实测如下：

| 工具 | Lean 精简版 | 原版 `pi-hashline-edit-pro@2.5.2` |
| --- | ---: | ---: |
| `read` | 85 | 247 |
| `replace` | 203 | 948 |
| `undo_last_replace` | 63 | 215 |
| **合计** | **351** | **1,410** |

相比固定版本的上游扩展，初始开销减少了 **1,059 tokens（75.1%）**。

测试环境为 Pi 0.84.4 与 `pi-context-view@0.4.3` 独立会话，关闭了 Pi 内置编辑工具，并排除了 Skills、上下文文件与无关扩展。Context View 按 `ceil(字符数 / 4)` 估算。未计入不会发送给模型的纯运行时 UI 与 Slash 命令。

## 版本说明

上游运行时锁定为 `pi-hashline-edit-pro@2.5.2`。

## 本地开发

```bash
npm ci
npm run check
```

## 开源协议与致谢

MIT 协议。本项目封装自采用 MIT 协议的 [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro)。