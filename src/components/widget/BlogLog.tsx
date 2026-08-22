import BlogWidget from '../blog/BlogWidget'
import ZDlGroup from '../partial/ZDlGroup'
import appConfig from '../../app.config'

interface BlogLogProps {
	customData?: {
		title?: string
		items?: Array<{ date: string, content: string }>
	}
}

export default function BlogLog({ customData }: BlogLogProps = {}) {
	const conf = customData || (appConfig as any).widgets?.log
	const title = conf?.title || '更新日志'

	const rawItems = conf?.items || [
		{ date: '2025-07-26', content: '重构至 React 19 + Rsbuild，迁移架构' },
		{ date: '2024-08-11', content: '重构至 Next.js / Content 架构' },
		{ date: '2023-05-24', content: '迁移为 Hexo，使用 Butterfly 主题' },
		{ date: '2020-08-24', content: '使用 blog 独立域名' },
		{ date: appConfig.timeEstablished, content: '发布第一篇文章' },
	]

	const blogLog = rawItems.map((item: any) => ({
		label: item.date,
		value: item.content,
	}))

	return (
		<BlogWidget card title={title}>
			<ZDlGroup size="large" items={blogLog} />
		</BlogWidget>
	)
}
