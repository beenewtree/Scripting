# 黄金价格走势小组件（Gold Price Widget）

基于 Scripting App（TypeScript + TSX）与 iOS 18 实现的国际金价小组件：

- 最新价格：美元/盎司（默认），也可配置为人民币/克主显示；
- 涨跌额与涨跌幅徽章（默认中国习惯：红涨绿跌，可切换）；
- 近 30 个交易日走势折线图（Swift Charts）；
- 30 日高/低与前收统计（大号小组件）；
- 中/大号小组件右上角“刷新”按钮（iOS 17+ 交互式小组件）；
- iOS 18 强调色（accented）模式适配：背景通过 `widgetBackground` 声明，
  染色模式下自动隐藏装饰背景，内容保持清晰；
- 网络失败时自动回退到上次成功数据（`Storage` 本地缓存）。

## 数据源

- 行情：Yahoo Finance 免费图表接口，`GC=F`（COMEX 黄金期货，美元/盎司），
  默认取近 1 个月日线；
- 汇率：`USDCNY=X` 用于“人民币/克”参考换算（尽力而为，失败不影响主行情）；
- 无需 API key。国内网络实测可用。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `widget.tsx` | 主屏幕小组件入口：抓取数据后调用 `Widget.present` |
| `gold_price_model.ts` | 数据抓取、Yahoo 响应解析、缓存与数字格式化 |
| `gold_widget_view.tsx` | 各尺寸小组件 UI（小/中/大/锁屏） |
| `app_intents.tsx` | 注册“手动刷新” AppIntent |
| `index.tsx` | App 内运行入口：选择尺寸调用 `Widget.preview` 预览 |
| `script.json` | 项目清单（名称、图标、说明） |

## 使用步骤

1. 将仓库根目录的 [gold-price-widget.scripting](../gold-price-widget.scripting)
   安装包传到 iPhone（AirDrop / 微信文件传输助手 / iCloud Drive）；
2. 在“文件”App 中点击安装包，选择“用 Scripting 打开”完成导入；
3. 长按主屏幕 Scripting 小组件 → “编辑小组件”，脚本/项目选择“黄金价格走势”；
4. 运行本目录 `index.tsx`，点选尺寸即可预览效果；
5. 建议先在 App 内预览确认布局，再到主屏幕实际添加并核对
   （Scripting 应用内预览与主屏幕渲染存在细微差异）。

仓库更新源码后，如需同步手机：重新导入新的 `.scripting` 安装包即可；
也可以把本仓库推到 GitHub 后，在 Scripting 中用“导入远程脚本”粘贴安装包
的 raw 地址（例如 `https://raw.githubusercontent.com/<你的用户名>/Scripting/main/gold-price-widget.scripting`），
后续可直接从远程刷新。

### 从源码新建（不使用安装包）

1. 在 Scripting App 新建脚本项目，名称填“Gold Price Widget”或任意名称；
2. 将本目录的 `widget.tsx`、`gold_price_model.ts`、`gold_widget_view.tsx`、
   `app_intents.tsx`、`index.tsx`、`script.json` 六个文件放入项目；
3. 进入项目后先运行 `index.tsx` 验证，再按上面步骤 3–5 添加到主屏幕。

## 可选参数

在“编辑小组件 → 参数”中输入 JSON，例如：

```json
{"unit":"cny","redUp":true}
```

| 参数 | 取值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `symbol` | 任意 Yahoo 代码 | `GC=F` | 行情代码，可换 `XAUUSD=X`、`SI=F` 等 |
| `range` | `5d`/`1mo`/`3mo` 等 | `1mo` | 图表取数范围 |
| `interval` | `1d`/`1h`/`15m` 等 | `1d` | K 线周期 |
| `unit` | `usd` / `cny` | `usd` | 主显示币种；`cny` 为人民币/克 |
| `redUp` | `true` / `false` | `true` | `true` 红涨绿跌（中国习惯） |
| `showCny` | `true` / `false` | `true` | 是否显示“≈ ¥/克”参考 |
| `refreshMinutes` | 5–180 | 15 | 请求 WidgetKit 新时间线的间隔（分钟） |

参数也支持直接填写行情代码（不填 JSON），例如参数填 `XAUUSD=X` 即可切换标的。

## iOS 版本要求

- 主屏幕小组件与折线图：iOS 16+；
- 交互式“刷新”按钮：iOS 17+；
- 强调色模式与 `widgetBackground` 适配：iOS 18+。
