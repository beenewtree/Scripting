import {
  Button,
  List,
  Navigation,
  NavigationStack,
  Script,
  Section,
  Text,
  Widget,
} from "scripting"

function PreviewRow({
  title,
  subtitle,
  family,
}: {
  title: string
  subtitle: string
  family: "systemSmall" | "systemMedium" | "systemLarge"
}) {
  return (
    <Button
      title={title}
      action={async () => {
        try {
          await Widget.preview({ family })
        } catch (error) {
          console.error("预览失败", error)
        }
      }}
    />
  )
}

function PreviewPage() {
  return (
    <NavigationStack>
      <List navigationTitle="黄金价格走势小组件">
        <Section header={<Text>预览</Text>}>
          <PreviewRow
            title="小号小组件"
            subtitle="主屏幕 systemSmall"
            family="systemSmall"
          />
          <PreviewRow
            title="中号小组件"
            subtitle="主屏幕 systemMedium，带走势图"
            family="systemMedium"
          />
          <PreviewRow
            title="大号小组件"
            subtitle="主屏幕 systemLarge，含 30 日统计"
            family="systemLarge"
          />
        </Section>
        <Section header={<Text>小组件参数（可选）</Text>}>
          <Text font={13}>
            在“编辑小组件 → 参数”中留空即使用默认值：
          </Text>
          <Text font={13}>
            默认：GC=F · 30 日日线 · 美元/盎司 · 红涨绿跌
          </Text>
          <Text font={13} attributedString={`主显示人民币/克：\`{"unit":"cny"}\``} />
          <Text font={13} attributedString={`欧美习惯绿涨红跌：\`{"redUp":false}\``} />
          <Text font={13} attributedString={`换行情代码：\`{"symbol":"XAUUSD=X"}\``} />
        </Section>
        <Section header={<Text>说明</Text>}>
          <Text font={13}>
            数据来自 Yahoo Finance（无需 API key）。小组件默认每 15 分钟
            请求一次新时间线，也可点击中/大号小组件右上角刷新按钮手动更新。
            iOS 18 强调色模式下背景会自动隐藏，核心内容保持清晰。
          </Text>
        </Section>
      </List>
    </NavigationStack>
  )
}

async function run() {
  await Navigation.present({
    element: <PreviewPage />,
    modalPresentationStyle: "pageSheet",
  })

  Script.exit()
}

run()
