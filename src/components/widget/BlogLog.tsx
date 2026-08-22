import BlogWidget from '../blog/BlogWidget'
import ZDlGroup from '../partial/ZDlGroup'
import appConfig from '../../app.config'

export default function BlogLog() {
	const blogLog = [
		{ label: '2025-07-26', value: '重构至 Nuxt 4 + Nuxt Content v3，迁移 zhilu.site 域名' },
		{ label: '2024-08-11', value: '重构至 Nuxt 3 + Nuxt Content v2' },
		{ label: '2023-05-24', value: '迁移为 Hexo，使用 Butterfly 主题' },
		{ label: '2020-08-24', value: '使用 zhilu.cyou 域名' },
		{ label: appConfig.timeEstablished, value: '发布第一篇文章' },
	]

	return (
		<BlogWidget card title="更新日志">
			<ZDlGroup size="large" items={blogLog} />
		</BlogWidget>
	)
}
