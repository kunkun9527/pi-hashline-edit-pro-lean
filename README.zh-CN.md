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

## 版本

上游运行时固定为 `pi-hashline-edit-pro@2.5.2`。

## 开发

```bash
npm ci
npm run check
```

## 许可证与上游

MIT。本项目包装了采用 MIT 许可证的 [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro)。