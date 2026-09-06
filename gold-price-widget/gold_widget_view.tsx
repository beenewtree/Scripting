import {
  Button,
  Capsule,
  Chart,
  Circle,
  HStack,
  Image,
  LineChart,
  Spacer,
  Text,
  VStack,
  Widget,
} from "scripting"
import { RefreshGoldPriceIntent } from "./app_intents"
import {
  changeCnyPerGram,
  cnyPerGram,
  formatNumber,
  formatPercent,
  formatSigned,
  formatTime,
  GoldData,
  GoldWidgetOptions,
} from "./gold_price_model"

const GOLD_CHART = "#C9962E"
const GOLD_DEEP = "#8A6112"
const GOLD_BADGE_BG = "#F4D68C"
const WIDGET_BG_LIGHT = "#FFF9EF"
const WIDGET_BG_DARK = "#17130C"

function isUp(value: number | null): boolean {
  return value != null && value >= 0
}

function trendColor(
  data: GoldData,
  options: GoldWidgetOptions,
): string {
  if (data.change == null) {
    return "secondaryLabel"
  }
  const up = isUp(data.change)
  if (up) {
    return options.redUp ? "systemRed" : "systemGreen"
  }
  return options.redUp ? "systemGreen" : "systemRed"
}

function headline(data: GoldData, options: GoldWidgetOptions): {
  text: string
  unit: string
} | null {
  if (data.price == null) {
    return null
  }
  const useCny = options.unit === "cny" && data.rate != null
  if (useCny) {
    const perGram = cnyPerGram(data)
    if (perGram != null) {
      return {
        text: `¥${formatNumber(perGram, 2)}`,
        unit: "人民币/克",
      }
    }
  }
  return {
    text: `$${formatNumber(data.price, 2)}`,
    unit: "美元/盎司",
  }
}

function changeAmountText(
  data: GoldData,
  options: GoldWidgetOptions,
): string | null {
  if (data.change == null) {
    return null
  }
  const useCny = options.unit === "cny" && data.rate != null
  if (useCny) {
    const perGram = changeCnyPerGram(data)
    if (perGram != null) {
      return `${formatSigned(perGram, 2)} 元/克`
    }
  }
  return `${formatSigned(data.change, 2)}`
}

function GoldBadge({ size = 20 }: { size?: number }) {
  return (
    <Text
      font={Math.max(8, Math.round(size * 0.52))}
      fontWeight="black"
      foregroundStyle={GOLD_DEEP}
      widgetAccentable
      frame={{ width: size, height: size }}
      background={<Circle fill={GOLD_BADGE_BG} />}
    >
      Au
    </Text>
  )
}

function WidgetHeader({
  data,
  options,
  showRefresh,
  compact = false,
}: {
  data: GoldData
  options: GoldWidgetOptions
  showRefresh: boolean
  compact?: boolean
}) {
  return (
    <HStack alignment="center" spacing={6}>
      <GoldBadge size={20} />
      <Text
        font={13}
        fontWeight="bold"
        foregroundStyle={GOLD_DEEP}
        lineLimit={1}
      >
        国际金价
      </Text>
      {!compact ? (
        <Text
          font={10}
          fontWeight="medium"
          foregroundStyle="secondaryLabel"
          lineLimit={1}
        >
          {options.unit === "cny" && data.rate != null
            ? "人民币/克"
            : "美元/盎司"}
        </Text>
      ) : null}
      <Spacer />
      {showRefresh ? (
        <Button
          intent={RefreshGoldPriceIntent()}
          tint={GOLD_DEEP}
          buttonStyle="plain"
        >
          <Image
            systemName="arrow.clockwise"
            imageScale="small"
            foregroundStyle={GOLD_DEEP}
          />
        </Button>
      ) : null}
    </HStack>
  )
}

function TrendBadge({
  data,
  options,
  compact = false,
}: {
  data: GoldData
  options: GoldWidgetOptions
  compact?: boolean
}) {
  if (data.change == null) {
    return null
  }
  const up = isUp(data.change)
  const color = trendColor(data, options)
  const amount = changeAmountText(data, options) ?? ""
  const percent = data.changePercent != null
    ? formatPercent(data.changePercent)
    : ""
  const label = compact
    ? percent
    : `${amount} ${percent}`
  return (
    <HStack
      alignment="center"
      spacing={3}
      padding={{ horizontal: 7, vertical: 2 }}
      background={<Capsule fill={color} />}
    >
      <Text
        font={11}
        fontWeight="bold"
        foregroundStyle="white"
      >
        {up ? "▲" : "▼"}
      </Text>
      <Text
        font={11}
        fontWeight="bold"
        foregroundStyle="white"
        monospacedDigit
        lineLimit={1}
        allowsTightening
      >
        {label}
      </Text>
    </HStack>
  )
}

function PriceRow({
  data,
  options,
  fontSize,
}: {
  data: GoldData
  options: GoldWidgetOptions
  fontSize: number
}) {
  const value = headline(data, options)
  if (value == null) {
    return null
  }
  return (
    <Text
      font={fontSize}
      fontWeight="bold"
      fontDesign="rounded"
      foregroundStyle="label"
      widgetAccentable
      monospacedDigit
      lineLimit={1}
      allowsTightening
    >
      {value.text}
    </Text>
  )
}

function TrendChart({
  data,
  height,
}: {
  data: GoldData
  height: number
}) {
  if (data.points.length === 0) {
    return null
  }
  return (
    <Chart
      chartXAxis="hidden"
      chartYAxis="hidden"
      chartLegend="hidden"
      frame={{ maxWidth: "infinity", height }}
    >
      <LineChart
        interpolationMethod="monotone"
        marks={data.points.map((point) => ({
          label: point.date,
          value: point.close,
          foregroundStyle: GOLD_CHART,
          lineStyle: {
            lineWidth: 2,
            lineCap: "round",
            lineJoin: "round",
          },
        }))}
      />
    </Chart>
  )
}

function UpdateLabel({ data }: { data: GoldData }) {
  const time = formatTime(data.fetchedAt)
  return (
    <Text
      font={10}
      foregroundStyle="tertiaryLabel"
      lineLimit={1}
    >
      {data.source === "cache"
        ? `缓存数据 · ${time}`
        : `${time} 更新 · Yahoo Finance`}
    </Text>
  )
}

function CnyReference({ data }: { data: GoldData }) {
  if (data.price == null || data.rate == null) {
    return null
  }
  const perGram = cnyPerGram(data)
  if (perGram == null) {
    return null
  }
  return (
    <Text
      font={11}
      fontWeight="medium"
      foregroundStyle="secondaryLabel"
      monospacedDigit
      lineLimit={1}
      allowsTightening
    >
      ≈ ¥{formatNumber(perGram, 2)}/克
    </Text>
  )
}

function StatCell({
  label,
  value,
  color = "label",
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <VStack
      alignment="leading"
      spacing={0}
      frame={{ maxWidth: "infinity" }}
    >
      <Text
        font={10}
        foregroundStyle="tertiaryLabel"
        lineLimit={1}
      >
        {label}
      </Text>
      <Text
        font={13}
        fontWeight="semibold"
        foregroundStyle={color}
        monospacedDigit
        lineLimit={1}
        allowsTightening
      >
        {value}
      </Text>
    </VStack>
  )
}

function ErrorView({
  data,
}: {
  data: GoldData
}) {
  return (
    <VStack
      alignment="leading"
      spacing={6}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
    >
      <GoldBadge size={22} />
      <Text font={14} fontWeight="bold">
        金价暂时不可用
      </Text>
      <Text
        font={11}
        foregroundStyle="secondaryLabel"
        lineLimit={2}
      >
        {data.message ?? "请稍后重试"}
      </Text>
      <Text font={10} foregroundStyle="tertiaryLabel">
        点击小组件打开 App 后点“刷新”可手动更新
      </Text>
    </VStack>
  )
}

function SmallWidget({
  data,
  options,
}: {
  data: GoldData
  options: GoldWidgetOptions
}) {
  if (data.price == null) {
    return (
      <VStack
        widgetBackground={{ light: WIDGET_BG_LIGHT, dark: WIDGET_BG_DARK }}
        padding={{ leading: 14, trailing: 14, top: 12, bottom: 12 }}
      >
        <ErrorView data={data} />
      </VStack>
    )
  }
  return (
    <VStack
      alignment="leading"
      spacing={1}
      widgetBackground={{ light: WIDGET_BG_LIGHT, dark: WIDGET_BG_DARK }}
      padding={{ leading: 14, trailing: 14, top: 10, bottom: 9 }}
      frame={{
        maxWidth: "infinity",
        maxHeight: "infinity",
        alignment: "topLeading",
      }}
    >
      <WidgetHeader
        data={data}
        options={options}
        showRefresh={false}
        compact
      />
      <Spacer />
      <PriceRow data={data} options={options} fontSize={26} />
      <TrendBadge data={data} options={options} compact />
      <Spacer />
      <TrendChart data={data} height={36} />
      <UpdateLabel data={data} />
    </VStack>
  )
}

function MediumWidget({
  data,
  options,
}: {
  data: GoldData
  options: GoldWidgetOptions
}) {
  if (data.price == null) {
    return (
      <VStack
        widgetBackground={{ light: WIDGET_BG_LIGHT, dark: WIDGET_BG_DARK }}
        padding={{ leading: 16, trailing: 16, top: 14, bottom: 14 }}
      >
        <ErrorView data={data} />
      </VStack>
    )
  }
  return (
    <VStack
      alignment="leading"
      spacing={0}
      widgetBackground={{ light: WIDGET_BG_LIGHT, dark: WIDGET_BG_DARK }}
      padding={{ leading: 16, trailing: 16, top: 10, bottom: 10 }}
      frame={{
        maxWidth: "infinity",
        maxHeight: "infinity",
        alignment: "topLeading",
      }}
    >
      <WidgetHeader data={data} options={options} showRefresh />
      <Spacer />
      <HStack alignment="center" spacing={10}>
        <VStack alignment="leading" spacing={4}>
          <PriceRow data={data} options={options} fontSize={26} />
          <TrendBadge data={data} options={options} />
          {options.showCny ? <CnyReference data={data} /> : null}
        </VStack>
        <TrendChart data={data} height={96} />
      </HStack>
      <Spacer />
      <HStack alignment="center" spacing={6}>
        <UpdateLabel data={data} />
        <Spacer />
        <Text
          font={10}
          foregroundStyle="tertiaryLabel"
          lineLimit={1}
        >
          {data.high != null
            ? `近30日高 $${formatNumber(data.high, 1)}`
            : ""}
        </Text>
      </HStack>
    </VStack>
  )
}

function LargeWidget({
  data,
  options,
}: {
  data: GoldData
  options: GoldWidgetOptions
}) {
  if (data.price == null) {
    return (
      <VStack
        widgetBackground={{ light: WIDGET_BG_LIGHT, dark: WIDGET_BG_DARK }}
        padding={{ leading: 18, trailing: 18, top: 16, bottom: 16 }}
      >
        <ErrorView data={data} />
      </VStack>
    )
  }
  const changeColor = trendColor(data, options)
  const percent = data.changePercent != null
    ? formatPercent(data.changePercent)
    : "--"
  return (
    <VStack
      alignment="leading"
      spacing={0}
      widgetBackground={{ light: WIDGET_BG_LIGHT, dark: WIDGET_BG_DARK }}
      padding={{ leading: 18, trailing: 18, top: 12, bottom: 12 }}
      frame={{
        maxWidth: "infinity",
        maxHeight: "infinity",
        alignment: "topLeading",
      }}
    >
      <WidgetHeader data={data} options={options} showRefresh />
      <Spacer />
      <HStack alignment="bottom" spacing={10}>
        <VStack alignment="leading" spacing={3}>
          <PriceRow data={data} options={options} fontSize={36} />
          <TrendBadge data={data} options={options} />
        </VStack>
        <Spacer />
        <VStack alignment="trailing" spacing={3}>
          {options.showCny ? <CnyReference data={data} /> : null}
          <Text
            font={11}
            fontWeight="medium"
            foregroundStyle={changeColor}
            monospacedDigit
            lineLimit={1}
          >
            区间{percent}
          </Text>
        </VStack>
      </HStack>
      <Spacer />
      <TrendChart data={data} height={122} />
      <Spacer />
      <HStack alignment="top" spacing={10}>
        <StatCell
          label="前收"
          value={data.prevClose != null
            ? `$${formatNumber(data.prevClose, 1)}`
            : "--"}
        />
        <StatCell
          label="30日高"
          value={data.high != null
            ? `$${formatNumber(data.high, 1)}`
            : "--"}
          color={options.redUp ? "systemRed" : "systemGreen"}
        />
        <StatCell
          label="30日低"
          value={data.low != null
            ? `$${formatNumber(data.low, 1)}`
            : "--"}
          color={options.redUp ? "systemGreen" : "systemRed"}
        />
        <StatCell
          label="涨跌幅"
          value={percent}
          color={changeColor}
        />
      </HStack>
      <Spacer />
      <HStack alignment="center" spacing={6}>
        <Text
          font={10}
          foregroundStyle="tertiaryLabel"
          lineLimit={1}
        >
          GC=F · COMEX 黄金期货
        </Text>
        <Spacer />
        <UpdateLabel data={data} />
      </HStack>
    </VStack>
  )
}

function AccessoryView({
  data,
  options,
}: {
  data: GoldData
  options: GoldWidgetOptions
}) {
  const value = headline(data, options)
  const changeColor = trendColor(data, options)
  const amount = changeAmountText(data, options) ?? ""
  const percent = data.changePercent != null
    ? formatPercent(data.changePercent)
    : ""
  return (
    <VStack alignment="leading" spacing={0}>
      <HStack alignment="center" spacing={4}>
        <GoldBadge size={15} />
        <Text
          font={11}
          fontWeight="medium"
          foregroundStyle="secondaryLabel"
          lineLimit={1}
        >
          国际金价
        </Text>
      </HStack>
      <Text
        font={15}
        fontWeight="bold"
        monospacedDigit
        lineLimit={1}
        allowsTightening
      >
        {value?.text ?? "--"}
      </Text>
      <Text
        font={11}
        fontWeight="semibold"
        foregroundStyle={changeColor}
        monospacedDigit
        lineLimit={1}
        allowsTightening
      >
        {data.change != null
          ? `${isUp(data.change) ? "▲" : "▼"} ${amount} ${percent}`
          : "行情暂不可用"}
      </Text>
    </VStack>
  )
}

function CircularAccessoryView({
  data,
  options,
}: {
  data: GoldData
  options: GoldWidgetOptions
}) {
  const percent = data.changePercent != null
    ? formatPercent(data.changePercent, 1)
    : null
  let compact: string | null = null
  if (data.price != null) {
    if (options.unit === "cny" && data.rate != null) {
      const perGram = cnyPerGram(data)
      if (perGram != null) {
        compact = `¥${formatNumber(perGram, 0)}`
      }
    }
    if (compact == null) {
      compact = `$${formatNumber(data.price, 0)}`
    }
  }
  return (
    <VStack alignment="center" spacing={0}>
      <Text
        font={9}
        fontWeight="bold"
        foregroundStyle={GOLD_DEEP}
      >
        Au
      </Text>
      <Text
        font={13}
        fontWeight="bold"
        monospacedDigit
        lineLimit={1}
        allowsTightening
      >
        {compact ?? "--"}
      </Text>
      {percent != null ? (
        <Text
          font={9}
          fontWeight="medium"
          foregroundStyle={trendColor(data, options)}
          monospacedDigit
          lineLimit={1}
          allowsTightening
        >
          {isUp(data.change) ? "▲" : "▼"} {percent}
        </Text>
      ) : null}
    </VStack>
  )
}

export function GoldPriceWidgetView({
  data,
  options,
}: {
  data: GoldData
  options: GoldWidgetOptions
}) {
  const family = String(Widget.family ?? "systemSmall")
  if (family === "accessoryRectangular") {
    return <AccessoryView data={data} options={options} />
  }
  if (family === "accessoryCircular") {
    return <CircularAccessoryView data={data} options={options} />
  }
  if (family.includes("large")) {
    return <LargeWidget data={data} options={options} />
  }
  if (family.includes("medium")) {
    return <MediumWidget data={data} options={options} />
  }
  return <SmallWidget data={data} options={options} />
}
