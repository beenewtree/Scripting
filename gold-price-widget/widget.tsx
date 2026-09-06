import { Widget } from "scripting"
import { loadGoldData, parseOptions } from "./gold_price_model"
import { GoldPriceWidgetView } from "./gold_widget_view"

async function main() {
  const options = parseOptions(Widget.parameter)
  const data = await loadGoldData(options)

  // 数据必须在 present 之前准备好；present 之后执行上下文会被立即销毁。
  Widget.present(<GoldPriceWidgetView data={data} options={options} />, {
    reloadPolicy: {
      policy: "after",
      date: new Date(Date.now() + options.refreshMinutes * 60 * 1000),
    },
  })
}

main()
