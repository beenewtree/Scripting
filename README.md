# Scripting 小组件集

本仓库用于存放基于 [Scripting App](https://scriptingapp.github.io/)（iOS，TypeScript + TSX）开发的自用小组件与脚本。

## 规划

- 每个小组件一个独立子目录，目录内以 `index.tsx` 作为入口。
- 以源码形式维护，避免提交构建产物与无关缓存。
- 文档与 API 口径以 Scripting 官方文档（App Store / TestFlight 版本）为准。

## 开发环境

- Scripting App 内置编辑器，或使用官方 VS Code 脚手架 + 真机实时预览。
- 所有组件和 API 从 `scripting` 包导入。

## 目录

| 小组件 | 说明 | 入口 |
| --- | --- | --- |
| [gold-price-widget](gold-price-widget/README.md) | 国际黄金价格走势：最新价、涨跌幅与近 30 日折线图，支持人民币/克参考换算与手动刷新（iOS 18 适配） | [widget.tsx](gold-price-widget/widget.tsx) · [安装包](gold-price-widget.scripting) |

### 快速安装（iPhone）

1. 把 [gold-price-widget.scripting](gold-price-widget.scripting) 传到 iPhone
   （AirDrop、微信文件传输助手或 iCloud Drive 均可）；
2. 在“文件”App 中点击该文件，选择**用“Scripting”打开**，确认导入；
3. 长按主屏幕空白处 → 左上角 “+” → 添加 **Scripting** 小组件；
4. 编辑小组件，把“脚本/项目”选为 **黄金价格走势**，运行
   [index.tsx](gold-price-widget/index.tsx) 可先预览各尺寸。

仓库同时保留 `gold-price-widget/` 源码目录，便于修改与版本管理；安装包即该目录的打包快照。
