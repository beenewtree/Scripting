// 黄金行情数据模块：抓取、解析、缓存与格式化。
// 数据源：Yahoo Finance 免费图表接口（无需 API key），主行情 GC=F（COMEX 黄金，美元/盎司），
// 汇率 USDCNY=X 用于可选的人民币/克参考显示。

export type GoldPoint = {
  date: Date
  close: number
}

export type GoldData = {
  symbol: string
  source: "live" | "cache"
  fetchedAt: Date
  // 最新价，单位：美元/盎司
  price: number | null
  // 前一交易日收盘价（用于计算涨跌）
  prevClose: number | null
  // 涨跌额，单位：美元/盎司
  change: number | null
  // 涨跌幅，单位为百分数（如 0.43 表示 +0.43%）
  changePercent: number | null
  points: GoldPoint[]
  high: number | null
  low: number | null
  // CNY / USD 汇率，抓取失败时为 null
  rate: number | null
  message: string | null
}

export type GoldWidgetOptions = {
  // Yahoo 行情代码，默认 GC=F（COMEX 黄金期货）
  symbol: string
  range: string
  interval: string
  // usd = 主显示美元/盎司；cny = 主显示人民币/克（依赖汇率成功）
  unit: "usd" | "cny"
  // true = 中国习惯红涨绿跌；false = 欧美习惯绿涨红跌
  redUp: boolean
  showCny: boolean
  refreshMinutes: number
}

export const TROY_OZ_TO_GRAM = 31.1034768

const YAHOO_CHART_BASE =
  "https://query1.finance.yahoo.com/v8/finance/chart/"
const CACHE_KEY = "gold.price.cache.v1"

export const DEFAULT_OPTIONS: GoldWidgetOptions = {
  symbol: "GC=F",
  range: "1mo",
  interval: "1d",
  unit: "usd",
  redUp: true,
  showCny: true,
  refreshMinutes: 15,
}

type CachePayload = {
  symbol: string
  fetchedAt: number
  price: number | null
  prevClose: number | null
  change: number | null
  changePercent: number | null
  high: number | null
  low: number | null
  rate: number | null
  dates: number[]
  closes: number[]
}

export function parseOptions(raw?: string | null): GoldWidgetOptions {
  const options: GoldWidgetOptions = { ...DEFAULT_OPTIONS }
  if (!raw || !raw.trim()) {
    return options
  }

  let parsed: unknown = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    // 参数不是 JSON 时，把它当作行情代码使用，方便快捷配置。
    options.symbol = raw.trim()
    return options
  }

  if (parsed == null || typeof parsed !== "object") {
    return options
  }

  const value = parsed as Record<string, unknown>
  if (typeof value.symbol === "string" && value.symbol.trim()) {
    options.symbol = value.symbol.trim()
  }
  if (typeof value.range === "string" && value.range.trim()) {
    options.range = value.range.trim()
  }
  if (typeof value.interval === "string" && value.interval.trim()) {
    options.interval = value.interval.trim()
  }
  if (value.unit === "cny") {
    options.unit = "cny"
  } else if (value.unit === "usd") {
    options.unit = "usd"
  }
  if (typeof value.redUp === "boolean") {
    options.redUp = value.redUp
  }
  if (typeof value.showCny === "boolean") {
    options.showCny = value.showCny
  }
  if (typeof value.refreshMinutes === "number" &&
    value.refreshMinutes >= 5 &&
    value.refreshMinutes <= 180) {
    options.refreshMinutes = value.refreshMinutes
  }

  return options
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) " +
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    },
    timeout: 10,
    debugLabel: "GoldPrice",
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return await response.json()
}

type YahooMeta = {
  regularMarketPrice?: unknown
  regularMarketChange?: unknown
  regularMarketChangePercent?: unknown
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null
}

function buildFromYahooChart(
  json: unknown,
  symbol: string,
): GoldData | null {
  const anyJson = json as {
    chart?: {
      result?: Array<{
        meta?: YahooMeta
        timestamp?: number[]
        indicators?: {
          quote?: Array<{ close?: Array<number | null> }>
        }
      }>
    }
  }
  const result = anyJson?.chart?.result?.[0]
  const timestamps = result?.timestamp
  const closes = result?.indicators?.quote?.[0]?.close
  if (!Array.isArray(timestamps) || !Array.isArray(closes)) {
    return null
  }

  const points: GoldPoint[] = []
  const count = Math.min(timestamps.length, closes.length)
  for (let i = 0; i < count; i++) {
    const close = closes[i]
    const timestamp = timestamps[i]
    if (typeof close === "number" &&
      Number.isFinite(close) &&
      typeof timestamp === "number") {
      points.push({
        date: new Date(timestamp * 1000),
        close,
      })
    }
  }
  if (points.length === 0) {
    return null
  }

  const meta = result?.meta ?? {}
  const lastClose = points[points.length - 1].close
  const price = toNumber(meta.regularMarketPrice) ?? lastClose

  let change = toNumber(meta.regularMarketChange)
  let changePercent = toNumber(meta.regularMarketChangePercent)
  if (change == null || changePercent == null) {
    const prev = points.length >= 2
      ? points[points.length - 2].close
      : null
    if (prev != null) {
      const computed = price - prev
      if (change == null) {
        change = computed
      }
      if (changePercent == null) {
        changePercent = prev === 0 ? 0 : (computed / prev) * 100
      }
    }
  }

  const closeValues = points.map((point) => point.close)
  return {
    symbol,
    source: "live",
    fetchedAt: new Date(),
    price,
    prevClose: change == null || changePercent == null
      ? (points.length >= 2 ? points[points.length - 2].close : null)
      : (price - (change ?? 0)),
    change,
    changePercent,
    points,
    high: Math.max(...closeValues),
    low: Math.min(...closeValues),
    rate: null,
    message: null,
  }
}

async function fetchUsdCnyRate(): Promise<number | null> {
  const url = YAHOO_CHART_BASE +
    "USDCNY=X?range=1d&interval=1d"
  const json = await fetchJson(url) as {
    chart?: {
      result?: Array<{
        meta?: YahooMeta
        indicators?: {
          quote?: Array<{ close?: Array<number | null> }>
        }
      }>
    }
  }
  const result = json?.chart?.result?.[0]
  if (result == null) {
    return null
  }
  const rate = toNumber(result.meta?.regularMarketPrice)
  if (rate != null) {
    return rate
  }
  const closes = result.indicators?.quote?.[0]?.close ?? []
  for (let i = closes.length - 1; i >= 0; i--) {
    if (closes[i] != null) {
      return closes[i]
    }
  }
  return null
}

function toCachePayload(data: GoldData): CachePayload {
  return {
    symbol: data.symbol,
    fetchedAt: data.fetchedAt.getTime(),
    price: data.price,
    prevClose: data.prevClose,
    change: data.change,
    changePercent: data.changePercent,
    high: data.high,
    low: data.low,
    rate: data.rate,
    dates: data.points.map((point) => point.date.getTime()),
    closes: data.points.map((point) => point.close),
  }
}

function fromCachePayload(payload: CachePayload): GoldData {
  const points: GoldPoint[] = []
  const count = Math.min(payload.dates.length, payload.closes.length)
  for (let i = 0; i < count; i++) {
    points.push({
      date: new Date(payload.dates[i]),
      close: payload.closes[i],
    })
  }
  return {
    symbol: payload.symbol,
    source: "cache",
    fetchedAt: new Date(payload.fetchedAt),
    price: payload.price,
    prevClose: payload.prevClose,
    change: payload.change,
    changePercent: payload.changePercent,
    points,
    high: payload.high,
    low: payload.low,
    rate: payload.rate,
    message: null,
  }
}

function readCache(): GoldData | null {
  try {
    const payload = Storage.get<CachePayload>(CACHE_KEY)
    if (payload == null) {
      return null
    }
    return fromCachePayload(payload)
  } catch (error) {
    console.log("读取金价缓存失败", error)
    return null
  }
}

function writeCache(data: GoldData): void {
  try {
    Storage.set(CACHE_KEY, toCachePayload(data))
  } catch (error) {
    console.log("写入金价缓存失败", error)
  }
}

export async function loadGoldData(
  options: GoldWidgetOptions,
): Promise<GoldData> {
  const cache = readCache()

  try {
    const chartUrl = YAHOO_CHART_BASE +
      encodeURIComponent(options.symbol) +
      `?range=${encodeURIComponent(options.range)}` +
      `&interval=${encodeURIComponent(options.interval)}`
    const json = await fetchJson(chartUrl)
    const data = buildFromYahooChart(json, options.symbol)

    if (data != null) {
      if (options.showCny || options.unit === "cny") {
        data.rate = await fetchUsdCnyRate()
      }
      if (data.rate == null && cache?.rate != null) {
        data.rate = cache.rate
      }
      data.source = "live"
      writeCache(data)
      return data
    }
  } catch (error) {
    console.log("获取黄金行情失败", error)
  }

  if (cache != null) {
    return cache
  }

  return {
    symbol: options.symbol,
    source: "cache",
    fetchedAt: new Date(),
    price: null,
    prevClose: null,
    change: null,
    changePercent: null,
    points: [],
    high: null,
    low: null,
    rate: null,
    message: "暂时无法获取行情，请稍后重试",
  }
}

// ---------- 展示格式化工具 ----------

export function formatNumber(value: number, digits = 2): string {
  const fixed = value.toFixed(digits)
  const parts = fixed.split(".")
  const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return parts.length > 1 ? `${integer}.${parts[1]}` : integer
}

export function formatSigned(value: number, digits = 2): string {
  const prefix = value >= 0 ? "+" : "-"
  return `${prefix}${formatNumber(Math.abs(value), digits)}`
}

export function formatPercent(value: number, digits = 2): string {
  return `${formatSigned(value, digits)}%`
}

export function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

export function formatTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function cnyPerGram(data: GoldData): number | null {
  if (data.price == null || data.rate == null) {
    return null
  }
  return (data.price * data.rate) / TROY_OZ_TO_GRAM
}

export function changeCnyPerGram(data: GoldData): number | null {
  if (data.change == null || data.rate == null) {
    return null
  }
  return (data.change * data.rate) / TROY_OZ_TO_GRAM
}
