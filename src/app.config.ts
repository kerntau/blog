import type { Nav, NavItem } from '@/types/nav'
import blogConfig from '../blog.config'

// 图标查询：https://yesicon.app/tabler
// 图标插件：https://marketplace.visualstudio.com/items?itemName=antfu.iconify

// @keep-sorted
const appConfig = {
	// 将 blog.config 中的配置项复制到 appConfig，方便调用
	...blogConfig,

	component: {
		alert: {
			/** 默认使用卡片风格还是扁平风格 */
			defaultStyle: 'card' as 'card' | 'flat',
		},

		codeblock: {
			/** 代码块触发折叠的行数 */
			triggerRows: 32,
			/** 代码块折叠后的行数 */
			collapsedRows: 16,
			/** 启用代码块缩进导航会关闭空格渲染 */
			enableIndentGuide: true,
			/** 代码块缩进导航(Indent Guige)竖线匹配空格数 */
			indent: 4,
			/** tab渲染宽度 */
			tabSize: 3,
		},

		/** 文章开头摘要 */
		excerpt: {
			animation: true,
			caret: '_',
		},

		/** 精选文章 Slide */
		slide: {
			/** 适合封面图无字时启用 */
			showTitle: true,
		},

		stats: {
			/** 归档页面每年标题对应的年龄 */
			birthYear: 2006,
			/** blog-stats widget 的预置文本 */
			wordCount: '约12万',
		},
	},

	// @keep-sorted
	footer: {
		/** 页脚版权信息，支持 <br> 换行等 HTML 标签 */
		copyright: `© 2026 kerntau`,
		/** 侧边栏底部图标导航 */
		iconNav: [
			{ icon: 'tabler:brand-github', text: 'GitHub: kerntau', url: 'https://github.com/kerntau' },
			{ icon: 'ri:bilibili-line', text: 'Bilibili', url: 'https://space.bilibili.com/9655855' },
			{ icon: 'tabler:rss', text: 'Atom订阅', url: '/atom.xml' },
			{ icon: 'tabler:brand-twitter', text: 'X (Twitter)', url: 'https://x.com/Kerntao' },
		] satisfies NavItem[],
		/** 页脚站点地图 */
		nav: [
			{
				title: '探索',
				items: [
					{ icon: 'tabler:rss', text: 'Atom订阅', url: '/atom.xml' },
					{ icon: 'ri:subway-line', text: '开往', url: 'https://www.travellings.cn/go.html' },
				],
			},
			{
				title: '社交',
				items: [
					{ icon: 'tabler:brand-github', text: 'GitHub', url: 'https://github.com/kerntau' },
					{ icon: 'ri:bilibili-fill', text: '哔哩哔哩', url: 'https://space.bilibili.com/9655855' },
					{ icon: 'tabler:brand-x', text: 'X (Twitter)', url: 'https://x.com/Kerntao' },
				],
			},
			{
				title: '信息',
				items: [
					{ icon: 'tabler:certificate', text: '萌ICP备20268811号', url: 'https://icp.gov.moe/?keyword=20268811' },
				],
			},
		] satisfies Nav,
	},

	/** 左侧栏顶部 Logo (与博主头像保持同一权威数据源) */
	header: {
		logo: '/avatar.webp',
		/** 展示标题文本，否则展示纯 Logo */
		showTitle: true,
		subtitle: '心中有景,花香满径',
		emojiTail: ['🌈', '☕', '💡', '🦄', '🎯'],
	},

	/** 友链页面 */
	link: {
		/** 无订阅源展示静音图标 */
		remindNoFeed: true,
		/** 友链分组内随机排序 */
		randomInGroup: true,
	},

	/** 左侧栏导航 */
	nav: [
		{
			title: '',
			items: [
				{ icon: 'tabler:files', text: '文章', url: '/' },
				{ icon: 'tabler:archive', text: '归档', url: '/archive' },
				{ icon: 'tabler:link', text: '友链', url: '/link' },
			],
		},
	] satisfies Nav,

	pagination: {
		perPage: 12,
		/** 默认排序方式，需要是 this.article.order 中的键名 */
		sortOrder: 'date' as keyof typeof blogConfig.article.order,
		/** 允许（普通/预览/归档）文章列表正序，开启后排序方式左侧图标可切换顺序 */
		allowAscending: false,
	},

	themes: {
		light: {
			icon: 'tabler:sun',
			tip: '浅色模式',
		},
		system: {
			icon: 'tabler:device-desktop',
			tip: '跟随系统',
		},
		dark: {
			icon: 'tabler:moon',
			tip: '深色模式',
		},
	},

	widgets: {
		tech: {
			title: '技术信息',
			services: [
				{ label: '部署平台', value: 'vercel', icon: 'simple-icons:vercel', iconColor: '' },
				{ label: '图片存储', value: '图仓', icon: 'tabler:photo', iconColor: '#3b6cba' },
				{ label: '开源协议', value: 'MIT', icon: 'tabler:license', iconColor: '#F59E0B' },
				{ label: '文章许可', value: blogConfig.copyright.abbr, icon: 'tabler:creative-commons', iconColor: '#10B981' },
				{ label: '规范域名', value: 'keru.in', icon: 'tabler:link', iconColor: '#6366F1' },
			],
			techstack: [
				{ name: 'React', version: '^19.1.0', icon: 'logos:react', iconColor: '' },
				{ name: 'Rsbuild', version: '^2.1.13', icon: '/icons/rsbuild.svg', iconColor: '' },
				{ name: 'TS', version: '^6.0.3', icon: 'logos:typescript-icon', iconColor: '' },
				{ name: 'Sass', version: '^1.99.0', icon: 'simple-icons:sass', iconColor: '#CC6699' },
				{ name: 'MDX', version: '^3.1.1', icon: 'simple-icons:mdx', iconColor: '#FCB32C' },
				{ name: 'Motion', version: '^12.38.0', icon: 'simple-icons:framer', iconColor: '#0055FF' },
				{ name: 'Node', version: '^22.17', icon: 'logos:nodejs-icon', iconColor: '' },
				{ name: 'pnpm', version: '^11.0.4', icon: 'simple-icons:pnpm', iconColor: '#F69220' },
			],
		},
		commGroup: {
			title: '博客/技术社区',
			groupName: '序栈接入点',
			account: '1722288011',
			icon: 'ri:qq-fill',
			bgImg: 'https://s1.tucang.cc/images/2026/8/22/%E3%80%90%E5%93%B2%E9%A3%8E%E5%A3%81%E7%BA%B8%E3%80%91%E5%BE%AE%E7%AC%91-%E6%88%B7%E5%A4%96-%E6%97%A5%E8%90%BD.jpg',
		},
		log: {
			title: '更新日志',
			items: [
				{ date: '2025-07-26', content: '重构至 React 19 + Rsbuild' },
				{ date: blogConfig.timeEstablished, content: '发布第一篇文章' },
			],
		},
		pageAsideMappings: {
			link: ['blog-stats', 'comm-group'],
			archive: ['blog-stats', 'blog-log'],
			home: ['blog-stats', 'blog-tech', 'blog-weather'],
			post: ['toc'],
		},
	},
}

export type AppConfig = typeof appConfig

export default appConfig
