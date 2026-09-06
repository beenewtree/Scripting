import { AppIntentManager, AppIntentProtocol, Widget } from "scripting"

// 小组件右上角“刷新”按钮使用的 AppIntent（iOS 17+ 交互式小组件）。
// 触发后让 WidgetKit 重新请求时间线，widget.tsx 会再次抓取最新行情。
export const RefreshGoldPriceIntent = AppIntentManager.register({
  name: "RefreshGoldPriceIntent",
  protocol: AppIntentProtocol.AppIntent,
  perform: async () => {
    Widget.reloadAll()
  },
})
