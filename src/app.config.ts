import type { Nav, NavItem } from '@/types/nav'
import { Temporal } from 'temporal-polyfill'
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
			{ icon: 'tabler:home', text: '个人主页', url: blogConfig.author.homepage },
			{ icon: 'tabler:brand-github', text: 'GitHub: kerntau', url: 'https://github.com/kerntau' },
			{ icon: 'ri:bilibili-line', text: 'Bilibili', url: 'https://space.bilibili.com/9655855' },
			{ icon: 'tabler:rss', text: 'Atom订阅', url: '/atom.xml' },
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
					{ icon: 'simple-icons:tiktok', text: '抖音', url: 'https://v.douyin.com/HWMgjLaTtFk' },
				],
			},
			{
				title: '信息',
				items: [
					{ icon: 'tabler:certificate', text: '鄂ICP备2025157857号', url: 'https://beian.miit.gov.cn/' },
					{ icon: 'tabler:shield-check', text: '鄂公网安备 42018502008592号', url: 'http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=42018502008592' },
				],
			},
		] satisfies Nav,
	},

	/** 左侧栏顶部 Logo (与博主头像保持同一权威数据源) */
	header: {
		logo: blogConfig.author.avatar,
		/** 展示标题文本，否则展示纯 Logo */
		showTitle: true,
		subtitle: blogConfig.subtitle,
		emojiTail: ['🚀', '🚀', '🚀', '🚀'],
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
				{ icon: 'tabler:link', text: '友链', url: '/link' },
				{ icon: 'tabler:archive', text: '归档', url: '/archive' },
			],
		},
	] satisfies Nav,

	pagination: {
		perPage: 10,
		/** 默认排序方式，需要是 this.article.order 中的键名 */
		sortOrder: 'date' as keyof typeof blogConfig.article.order,
		/** 允许（普通/预览/归档）文章列表正序，开启后排序方式左侧图标可切换顺序 */
		allowAscending: false,
	},

	widgets: {
		tech: {
			title: '技术信息',
			services: [
				{ label: '部署平台', value: 'vercel', icon: 'logos:vercel-icon', iconColor: '#0052D9' },
				{ label: '图片存储', value: 'Cloudflare R2', icon: 'devicon:cloudflare', iconColor: '' },
				{ label: '开源协议', value: 'MIT', icon: 'tabler:license', iconColor: '#F59E0B' },
				{ label: '文章许可', value: blogConfig.copyright.abbr, icon: '', iconColor: '' },
				{ label: '规范域名', value: 'keru.in', icon: '', iconColor: '' },
			],
			techstack: [
				{ name: 'React', version: '^19.0.0', icon: 'logos:react', iconColor: '' },
				{ name: 'Rsbuild', version: '^2.1.13', icon: 'tabler:bolt', iconColor: '#F85D00' },
			],
		},
		commGroup: {
			title: '博客/技术社区',
			groupName: '纸网接入点',
			account: '169994096',
			icon: 'ri:qq-fill',
			bgImg: '',
		},
		log: {
			title: '更新日志',
			items: [
				{ date: '2025-07-26', content: '重构至 React 19 + Rsbuild，迁移架构' },
				{ date: '2024-08-11', content: '重构至 Next.js / Content 架构' },
				{ date: '2023-05-24', content: '迁移为 Hexo，使用 Butterfly 主题' },
				{ date: '2020-08-24', content: '使用 blog 独立域名' },
				{ date: blogConfig.timeEstablished, content: '发布第一篇文章' },
			],
		},
		pageAsideMappings: {
			link: ['blog-stats', 'comm-group'],
			archive: ['blog-stats', 'blog-log'],
			home: ['blog-stats', 'blog-tech', 'comm-group'],
			post: ['toc'],
		},
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
}

export type AppConfig = typeof appConfig

export default appConfig
