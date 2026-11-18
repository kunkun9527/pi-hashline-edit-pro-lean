<div align="center">

# pi-hashline-edit-pro-lean

**按锚点改文件，安全不打折，工具说明短得多。**

[English](README.md) · 完整配置：[My Lean Pi Setup](https://github.com/kunkun9527/my-lean-pi-setup)

</div>

<!-- token-benchmark:summary:start -->
> **常驻上下文：Lean 1,282 tokens，上游 `pi-hashline-edit-pro@6.4.6` 4,732 tokens，少 72.9%。**
<!-- token-benchmark:summary:end -->

[`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro) 的精简版。运行时直接用上游 `6.4.6`，我只精简了模型每轮都要读的工具说明。

## 安装

```bash
pi install git:github.com/kunkun9527/pi-hashline-edit-pro-lean
```

需要 Pi `>=0.99.0`、Node.js `>=22.19.0`。不要和上游或其他 Hashline 包装同时安装，否则工具会注册两次。

## 和上游比

**保留**：

- 四字符 Hashline 锚点，以及对已下发锚点的校验。
- 只认锚点的 `replace`、`replace_match`、`insert`、`copy`、`move`（默认不传 `path`），以及按文件撤销。
- 带锚点的 ripgrep 搜索，工具名是 `grep`，默认开启。
- Hash store、自动读取、文件检查、写入回显防护和上游的 session hooks。
- 运行时、schema 和工具开关全部用上游的，没有删减或重写安全机制。

**精简**：只动模型看得到的文字，每一句都是上游原话的缩写，不加我自己的规则。

- 每条规则只说一次。参数说明大多删掉，只留范围首尾、copy 的源和目标（move 字段相同）、`text` 这几处上游原文。
- 上游已经会报错、而且报错里写明怎么改的规则（范围内的行没读过、同批范围重叠、锚点过期、path 和锚点对不上），交给报错，不写进提示。
- 违反后会悄悄改错、或者丢了东西报错也找不回的规则，原样保留：`anchor│content` 行格式、转义只解码一次、batch 和单槽撤销、追加和删除的语义。
- 上游只在某些设置下才出现的句子，仍然跟着设置走；上游在每个工具上都重复的"优先用哪个工具"，只在 `read` 上留一次。

**新增**：

- **参数容错**：校验前，`replace` 把已废弃的 `replacement_text` / `replacement_lines` 当成 `text`，`insert` 把 `lines` 当成 `text`；和 `path` 相同的 `ref` 会被去掉。有歧义的输入（比如缺 `remove_to`、`path` 或锚点）照样报错。
- **折叠显示**：兼容本地的 `@local/pi-collapsed-tools.display-service.v1` 折叠显示装饰器。

## 用法

```text
read
replace            # 只认锚点，默认不传 path
replace_match      # 在锚点范围内替换一段精确的子串
insert             # 只认锚点，默认不传 path
copy / move        # 复制或移动一段锚点行，可以跨文件
grep               # 带锚点的 ripgrep，替换 Pi 自带的 grep
undo_last_change   # 仍然要传 path
```

- 锚点必须从 `read` 或 `grep` 的结果里复制，不能自己编。
- `replace` 和 `insert` 接收一个原样写入的 `text` 字符串，里面的换行就是分行；`replace` 传 `text: ""` 表示删除选中的范围。
- 同一条消息里对同一个文件的编辑合成一个 batch，共用一个 diff，撤销也只要一次。

## 配置

配置文件是 `~/.config/pi-hashline-edit-pro/config.json`（或 `$PI_HASHLINE_DIR/config.json`），和上游共用，用 `/hashline-config` 修改。

默认值和上游一样，八个工具全开。`6.4.5-lean.2` 及更早的版本加载时会往配置里写 `replaceMatchEnabled: false`（再早的版本还会写 `copyMoveEnabled: false`），升级后这些值还在。请在 `/hashline-config` 里把工具重新打开，或者写入：

```json
{
  "copyMoveEnabled": true,
  "replaceMatchEnabled": true
}
```

有两个上游设置会换回 Pi 自带的普通工具：`anchorGrepEnabled: false` 注册自带的 `grep`；被 `disableOnModels` 匹配到的模型改用自带的 `read` 和 `grep`，编辑工具关闭。这些普通工具用的是 Pi 自己的说明。

## 从 4.x 升级

- `replacement_lines` / `lines` 数组改成了 `text` 字符串，`[]` 改成 `""`。
- `anchor_grep` 改名为 `grep`，并替换 Pi 自带的 `grep`。
- 新增 `replace_match`、`copy`、`move`，默认开启，可以在 `/hashline-config` 里关掉。
- 纯删除会校验首尾两行；中间没读到过的行，按磁盘上的当前内容删除。

升级后请开一个新的 Pi 会话，让模型拿到新的 schema 和说明。

## Token 对比

<!-- token-benchmark:benchmark:start -->
只启用这一个扩展时，模型每轮都会读到的内容：

| 版本 | 构成 | 合计 |
| --- | --- | ---: |
| Lean `pi-hashline-edit-pro-lean@6.4.6-lean.3` | `read` (147) + `grep` (146) + `replace` (254) + `replace_match` (195) + `insert` (131) + `copy` (216) + `move` (99) + `undo_last_change` (94) | **1,282** |
| 上游 `pi-hashline-edit-pro@6.4.6` | `read` (388) + `grep` (514) + `replace` (644) + `replace_match` (953) + `insert` (524) + `copy` (731) + `move` (707) + `undo_last_change` (271) | **4,732** |

少 **3,450 tokens（72.9%）**。

<sub>测量方式：Pi 1.2.0，每个版本在独立的临时进程里测，工作目录和配置都是空的。不计内置工具、Skills、上下文文件、会话历史、用户消息、其他扩展、运行时 UI 和 Slash Commands；计入 `before_agent_start` 注入的内容。Token 按 `ceil(字符数 / 4)` 估算，不是实际计费值。</sub>
<!-- token-benchmark:benchmark:end -->

## 开发

```bash
npm ci
npm run check
```

## 协议与致谢

MIT。运行时来自 [@YuGiMob](https://github.com/YuGiMob) 的 [`pi-hashline-edit-pro`](https://github.com/YuGiMob/pi-hashline-edit-pro)（MIT）。
