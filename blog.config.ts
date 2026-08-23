import type { FeedEntry } from './src/types/feed'

const basicConfig = {
	title: '序栈',
	subtitle: '心中有景,花香满径',
	// 长 description 利好于 SEO
	description: '在有序的世界里，寻一处生活的归栈。用理性梳理日常，用技术温柔时光，不慌不忙，自在生长。',
	author: {
		name: 'kerntau',
		avatar: '/avatar.webp',
		email: '1722288011@qq.com',
		homepage: 'https://keru.in/',
	},
	copyright: {
		abbr: 'CC BY-NC-SA 4.0',
		name: '署名-非商业性使用-相同方式共享 4.0 国际',
		url: 'https://keru.in/',
	},
	favicon: '/favicon.ico',
	language: 'zh-CN',
	timeEstablished: '2025-11-10',
	timeZone: 'Asia/Shanghai',
	url: 'https://keru.in/',
	defaultCategory: '前端开发',
}

// 存储 next.config 和 app.config 共用的配置
// 此处为启动时需要的配置，启动后可变配置位于 src/app.config.ts
// @keep-sorted
const blogConfig = {
	...basicConfig,

	article: {
		categories: {
			[basicConfig.defaultCategory]: { icon: 'tabler:code', color: '#7777ff' },
			'前端开发': { icon: 'tabler:browser', color: '#33aaff' },
			'后端开发': { icon: 'tabler:server', color: '#7777ff' },
			'数据库系统': { icon: 'tabler:database', color: '#ffaa33' },
			'云原生与运维': { icon: 'tabler:cloud', color: '#33bbaa' },
			'网络安全': { icon: 'tabler:shield-lock', color: '#ff7733' },
			'人工智能': { icon: 'tabler:brain', color: '#ff5577' },
			'技术': { icon: 'tabler:mouse', color: '#33aaff' },
			'开发': { icon: 'tabler:code', color: '#7777ff' },
			'安全': { icon: 'tabler:bug', color: '#ff7733' },
			'杂谈': { icon: 'tabler:message', color: '#33bbaa' },
			'生活': { icon: 'tabler:leaf', color: '#ff7777' },
			'未分类': { icon: 'tabler:circle-dashed', color: '#888888' },
		},
		/** 文章版式，首个为默认版式 */
		types: {
			tech: {},
			story: {},
		},
		/** 分类排序方式，键为排序字段，值为显示名称 */
		order: {
			date: '创建日期',
			updated: '更新日期',
		},
		/** 使用 pnpm new 新建文章时自动生成自定义链接（permalink/abbrlink） */
		useRandomPremalink: false,
		/** 隐藏基于文件路由（不是自定义链接）的 URL /post 路径前缀 */
		hidePostPrefix: true,
		/** 禁止搜索引擎收录的路径 */
		robotsNotIndex: ['/preview', '/previews/*'],
	},

	/** 博客 Atom 订阅源 */
	feed: {
		/** 订阅源最大文章数量 */
		limit: 50,
		/** 订阅源是否启用XSLT样式 */
		enableStyle: true,
	},

	/** 向 <head> 中添加脚本 */
	scripts: [],

	/** 自己部署的 Twikoo 服务 */
	twikoo: {
		envId: '',
		preload: '',
	},
}

/** 用于生成 OPML 和友链页面配置 */
export const myFeed: FeedEntry = {
	author: blogConfig.author.name,
	sitenick: '',
	title: blogConfig.title,
	desc: blogConfig.subtitle || blogConfig.description,
	link: blogConfig.url,
	feed: new URL('/atom.xml', blogConfig.url).toString(),
	icon: blogConfig.favicon,
	avatar: blogConfig.author.avatar,
	archs: ['React', 'Rsbuild'],
	date: blogConfig.timeEstablished,
	comment: '这是我自己',
}

export default blogConfig
