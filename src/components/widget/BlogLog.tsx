import BlogWidget from '../blog/BlogWidget'
import ZDlGroup from '../partial/ZDlGroup'
import appConfig from '../../app.config'

export default function BlogLog() {
	const blogLog = [
		{ label: '2026-05-11', value: '从旧项目迁移并重构至 Next.js 15' },
		{ label: '2026-04-10', value: '初始化 Cotovo 个人空间' },
		{ label: appConfig.timeEstablished, value: '开启博客之旅' },
	]

	return (
		<BlogWidget card title="更新日志">
			<ZDlGroup size="large" items={blogLog} />
		</BlogWidget>
	)
}
