import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec, spawn } from 'node:child_process'
import matter from 'gray-matter'
import { Temporal } from 'temporal-polyfill'
import { compile } from '@mdx-js/mdx'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import GithubSlugger from 'github-slugger'
import { visit } from 'unist-util-visit'

import { calculatePostStats, normalizeFrontmatter, parseArrayField } from '../src/utils/post-meta'
import { preprocessMdc } from '../src/utils/mdc'
import { buildStaticData } from './build-static'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const contentPostsDir = path.join(rootDir, 'content', 'posts')
const feedsFilePath = path.join(rootDir, 'src', 'feeds.ts')
const blogConfigPath = path.join(rootDir, 'blog.config.ts')
const appConfigPath = path.join(rootDir, 'src', 'app.config.ts')
const publicDir = path.join(rootDir, 'public')
const dataDir = path.join(rootDir, 'src', 'data')
const auditLogsPath = path.join(dataDir, 'admin-audit.json')
const snapshotsDir = path.join(dataDir, 'post-snapshots')

const PORT = Number(process.env.ADMIN_PORT) || 3001
const startTime = Date.now()

// ==================== 静态数据自动同步触发器 ====================

let staticBuildTimer: NodeJS.Timeout | null = null
let isBuildingStatic = false

function triggerStaticBuild(delayMs = 300) {
	if (staticBuildTimer) {
		clearTimeout(staticBuildTimer)
	}
	staticBuildTimer = setTimeout(async () => {
		if (isBuildingStatic) return
		isBuildingStatic = true
		try {
			console.log('🔄 后台管理数据变更，正在自动同步静态索引与预编译数据...')
			await buildStaticData()
			console.log('✅ 静态索引与预编译数据已自动同步完成')
		}
		catch (err) {
			console.error('❌ 自动同步静态数据失败:', err)
		}
		finally {
			isBuildingStatic = false
		}
	}, delayMs)
}

// ==================== 工具函数 ====================

function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
	res.writeHead(statusCode, {
		'Content-Type': 'application/json; charset=utf-8',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	})
	res.end(JSON.stringify(data))
}

function parseJsonBody<T = any>(req: http.IncomingMessage): Promise<T> {
	return new Promise((resolve, reject) => {
		let body = ''
		req.on('data', (chunk) => {
			body += chunk
		})
		req.on('end', () => {
			if (!body.trim()) {
				resolve({} as T)
				return
			}
			try {
				resolve(JSON.parse(body))
			}
			catch (err) {
				reject(new Error(`JSON 解析错误: ${(err as Error).message}`))
			}
		})
		req.on('error', reject)
	})
}

function safeWriteFileSync(filePath: string, content: string) {
	const dir = path.dirname(filePath)
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true })
	}
	const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`
	fs.writeFileSync(tmpPath, content, 'utf-8')
	try {
		fs.renameSync(tmpPath, filePath)
	}
	catch {
		// Windows EPERM / EBUSY 场景回退机制
		try {
			fs.copyFileSync(tmpPath, filePath)
			fs.unlinkSync(tmpPath)
		}
		catch {
			fs.writeFileSync(filePath, content, 'utf-8')
		}
	}
}

function walkDir(dir: string, fileList: string[] = []): string[] {
	if (!fs.existsSync(dir)) return fileList
	const files = fs.readdirSync(dir)
	for (const file of files) {
		const fullPath = path.join(dir, file)
		const stat = fs.statSync(fullPath)
		if (stat.isDirectory()) {
			walkDir(fullPath, fileList)
		}
		else if (/\.(?:md|mdx)$/i.test(file)) {
			fileList.push(fullPath)
		}
	}
	return fileList
}

// 全局配置写入串行互斥队列，彻底消除并发写文件的覆盖竞争
let configWriteMutex = Promise.resolve()

function runExclusiveConfigTask<T>(task: () => Promise<T>): Promise<T> {
	const next = configWriteMutex.then(task, task)
	configWriteMutex = next.then(() => {}, () => {})
	return next
}

function generateAppConfigCode(cfg: any): string {
	const component = cfg.component || {}
	const alert = component.alert || { defaultStyle: 'card' }
	const codeblock = component.codeblock || { triggerRows: 32, collapsedRows: 16, enableIndentGuide: true, indent: 4, tabSize: 3 }
	const excerpt = component.excerpt || { animation: true, caret: '_' }
	const slide = component.slide || { showTitle: true }
	const stats = component.stats || { birthYear: 2006, wordCount: '约12万' }

	const footer = cfg.footer || {}
	const copyright = footer.copyright || `© 2026 ${cfg.author?.name || 'kerntau'}`
	const iconNav = footer.iconNav || [
		{ icon: 'tabler:brand-github', text: 'GitHub: kerntau', url: 'https://github.com/kerntau' },
		{ icon: 'ri:bilibili-line', text: 'Bilibili', url: 'https://space.bilibili.com/9655855' },
		{ icon: 'tabler:rss', text: 'Atom订阅', url: '/atom.xml' },
		{ icon: 'tabler:brand-twitter', text: 'X (Twitter)', url: 'https://x.com/Kerntao' },
	]
	const footerNav = footer.nav || []

	const header = cfg.header || {}
	const headerLogo = header.logo || '/avatar.webp'
	const showTitle = header.showTitle !== undefined ? header.showTitle : true
	const subtitle = header.subtitle || '心中有景,花香满径'
	const emojiTail = header.emojiTail || ['🌈', '☕', '💡', '🦄', '🎯']

	const link = cfg.link || { remindNoFeed: true, randomInGroup: true }
	const nav = cfg.nav || [
		{
			title: '',
			items: [
				{ icon: 'tabler:files', text: '文章', url: '/' },
				{ icon: 'tabler:category', text: '分类', url: '/categories' },
				{ icon: 'tabler:archive', text: '归档', url: '/archive' },
				{ icon: 'tabler:link', text: '友链', url: '/link' },
			],
		},
	]
	const pagination = cfg.pagination || { perPage: 12, sortOrder: 'date', allowAscending: false }
	const widgets = cfg.widgets || {}
	const themes = cfg.themes || {
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
	}

	let code = `import type { Nav, NavItem } from '@/types/nav'
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
			defaultStyle: '${alert.defaultStyle || 'card'}' as 'card' | 'flat',
		},

		codeblock: {
			/** 代码块触发折叠的行数 */
			triggerRows: ${Number(codeblock.triggerRows) || 32},
			/** 代码块折叠后的行数 */
			collapsedRows: ${Number(codeblock.collapsedRows) || 16},
			/** 启用代码块缩进导航会关闭空格渲染 */
			enableIndentGuide: ${Boolean(codeblock.enableIndentGuide)},
			/** 代码块缩进导航(Indent Guige)竖线匹配空格数 */
			indent: ${Number(codeblock.indent) || 4},
			/** tab渲染宽度 */
			tabSize: ${Number(codeblock.tabSize) || 3},
		},

		/** 文章开头摘要 */
		excerpt: {
			animation: ${Boolean(excerpt.animation)},
			caret: '${(excerpt.caret || '_').replace(/'/g, '\\\'')}',
		},

		/** 精选文章 Slide */
		slide: {
			/** 适合封面图无字时启用 */
			showTitle: ${Boolean(slide.showTitle)},
		},

		stats: {
			/** 归档页面每年标题对应的年龄 */
			birthYear: ${Number(stats.birthYear) || 2006},
			/** blog-stats widget 的预置文本 */
			wordCount: '${(stats.wordCount || '约12万').replace(/'/g, '\\\'')}',
		},
	},

	// @keep-sorted
	footer: {
		/** 页脚版权信息，支持 <br> 换行等 HTML 标签 */
		copyright: ${copyright.startsWith('`') ? copyright : `\`${copyright.replace(/`/g, '\\`')}\``},
		/** 侧边栏底部图标导航 */
		iconNav: [\n`

	for (const item of iconNav) {
		const urlVal = item.url === 'blogConfig.author.homepage'
			? 'blogConfig.author.homepage'
			: `'${(item.url || '').replace(/'/g, '\\\'')}'`
		code += `\t\t\t{ icon: '${(item.icon || '').replace(/'/g, '\\\'')}', text: '${(item.text || '').replace(/'/g, '\\\'')}', url: ${urlVal} },\n`
	}
	code += `\t\t] satisfies NavItem[],
		/** 页脚站点地图 */
		nav: [\n`

	for (const group of footerNav) {
		code += `\t\t\t{\n\t\t\t\ttitle: '${(group.title || '').replace(/'/g, '\\\'')}',\n\t\t\t\titems: [\n`
		for (const item of group.items || []) {
			code += `\t\t\t\t\t{ icon: '${(item.icon || '').replace(/'/g, '\\\'')}', text: '${(item.text || '').replace(/'/g, '\\\'')}', url: '${(item.url || '').replace(/'/g, '\\\'')}' },\n`
		}
		code += `\t\t\t\t],\n\t\t\t},\n`
	}

	code += `\t\t] satisfies Nav,
	},

	/** 左侧栏顶部 Logo (与博主头像保持同一权威数据源) */
	header: {
		logo: ${headerLogo === 'blogConfig.author.avatar' ? 'blogConfig.author.avatar' : `'${headerLogo.replace(/'/g, '\\\'')}'`},
		/** 展示标题文本，否则展示纯 Logo */
		showTitle: ${Boolean(showTitle)},
		subtitle: ${subtitle === 'blogConfig.subtitle' ? 'blogConfig.subtitle' : `'${subtitle.replace(/'/g, '\\\'')}'`},
		emojiTail: [${(emojiTail || []).map((e: string) => `'${e.replace(/'/g, '\\\'')}'`).join(', ')}],
	},

	/** 友链页面 */
	link: {
		/** 无订阅源展示静音图标 */
		remindNoFeed: ${Boolean(link.remindNoFeed)},
		/** 友链分组内随机排序 */
		randomInGroup: ${Boolean(link.randomInGroup)},
	},

	/** 左侧栏导航 */
	nav: [\n`

	for (const group of nav) {
		code += `\t\t{\n\t\t\ttitle: '${(group.title || '').replace(/'/g, '\\\'')}',\n\t\t\titems: [\n`
		for (const item of group.items || []) {
			code += `\t\t\t\t{ icon: '${(item.icon || '').replace(/'/g, '\\\'')}', text: '${(item.text || '').replace(/'/g, '\\\'')}', url: '${(item.url || '').replace(/'/g, '\\\'')}' },\n`
		}
		code += `\t\t\t],\n\t\t},\n`
	}

	code += `\t] satisfies Nav,

	pagination: {
		perPage: ${Number(pagination.perPage) || 12},
		/** 默认排序方式，需要是 this.article.order 中的键名 */
		sortOrder: '${pagination.sortOrder || 'date'}' as keyof typeof blogConfig.article.order,
		/** 允许（普通/预览/归档）文章列表正序，开启后排序方式左侧图标可切换顺序 */
		allowAscending: ${Boolean(pagination.allowAscending)},
	},

	themes: {\n`

	for (const [themeName, themeData] of Object.entries(themes)) {
		const t = themeData as any
		code += `\t\t${themeName}: {\n\t\t\ticon: '${(t.icon || '').replace(/'/g, '\\\'')}',\n\t\t\ttip: '${(t.tip || '').replace(/'/g, '\\\'')}',\n\t\t},\n`
	}

	code += `\t},

	widgets: {
		tech: {
			title: '${(widgets.tech?.title || '技术信息').replace(/'/g, '\\\'')}',
			services: [\n`

	for (const s of (widgets.tech?.services || [])) {
		const valExpr = s.value === 'CC BY-NC-SA 4.0' || s.value === 'blogConfig.copyright.abbr'
			? 'blogConfig.copyright.abbr'
			: `'${(s.value || '').replace(/'/g, '\\\'')}'`
		code += `\t\t\t\t{ label: '${(s.label || '').replace(/'/g, '\\\'')}', value: ${valExpr}, icon: '${(s.icon || '').replace(/'/g, '\\\'')}', iconColor: '${(s.iconColor || '').replace(/'/g, '\\\'')}' },\n`
	}
	code += `\t\t\t],\n\t\t\ttechstack: [\n`
	for (const t of (widgets.tech?.techstack || [])) {
		code += `\t\t\t\t{ name: '${(t.name || '').replace(/'/g, '\\\'')}', version: '${(t.version || '').replace(/'/g, '\\\'')}', icon: '${(t.icon || '').replace(/'/g, '\\\'')}', iconColor: '${(t.iconColor || '').replace(/'/g, '\\\'')}' },\n`
	}
	code += `\t\t\t],\n\t\t},\n`

	code += `\t\tcommGroup: {
			title: '${(widgets.commGroup?.title || '博客/技术社区').replace(/'/g, '\\\'')}',
			groupName: '${(widgets.commGroup?.groupName || '序栈接入点').replace(/'/g, '\\\'')}',
			account: '${(widgets.commGroup?.account || '1722288011').replace(/'/g, '\\\'')}',
			icon: '${(widgets.commGroup?.icon || 'ri:qq-fill').replace(/'/g, '\\\'')}',
			bgImg: '${(widgets.commGroup?.bgImg || '').replace(/'/g, '\\\'')}',
		},\n`

	code += `\t\tlog: {
			title: '${(widgets.log?.title || '更新日志').replace(/'/g, '\\\'')}',
			items: [\n`
	for (const item of (widgets.log?.items || [])) {
		const dateExpr = item.date === '2025-11-10' || item.date === 'blogConfig.timeEstablished'
			? 'blogConfig.timeEstablished'
			: `'${(item.date || '').replace(/'/g, '\\\'')}'`
		code += `\t\t\t\t{ date: ${dateExpr}, content: '${(item.content || '').replace(/'/g, '\\\'')}' },\n`
	}
	code += `\t\t\t],\n\t\t},\n`

	code += `\t\tpageAsideMappings: {\n`
	const mappings = widgets.pageAsideMappings || { home: ['blog-stats', 'blog-tech', 'comm-group'], archive: ['blog-stats', 'blog-log'], post: ['toc'], link: ['blog-stats', 'comm-group'] }
	for (const [pageKey, widgetIds] of Object.entries(mappings)) {
		code += `\t\t\t${pageKey}: [${(widgetIds as string[]).map(id => `'${id}'`).join(', ')}],\n`
	}
	code += `\t\t},\n\t},
}

export type AppConfig = typeof appConfig

export default appConfig
`
	return code
}

async function updateAppConfigFile(updater: (currentConfig: any) => any) {
	return runExclusiveConfigTask(async () => {
		const mod = await import(`../src/app.config.ts?t=${Date.now()}`)
		const current = mod.default || {}
		const updated = updater(current)
		const newTsCode = generateAppConfigCode(updated)
		safeWriteFileSync(appConfigPath, newTsCode)
	})
}

function generateBlogConfigCode(cfg: any, myFeedData: any): string {
	const basic = {
		title: cfg.title || '序栈',
		subtitle: cfg.subtitle || '心中有景,花香满径',
		description: cfg.description || '在有序的世界里，寻一处生活的归栈。用理性梳理日常，用技术温柔时光，不慌不忙，自在生长。',
		author: {
			name: cfg.author?.name || 'kerntau',
			avatar: cfg.author?.avatar || '/avatar.webp',
			email: cfg.author?.email || '1722288011@qq.com',
			homepage: cfg.author?.homepage || 'https://keru.in/',
		},
		copyright: {
			abbr: cfg.copyright?.abbr || 'CC BY-NC-SA 4.0',
			name: cfg.copyright?.name || '署名-非商业性使用-相同方式共享 4.0 国际',
			url: cfg.copyright?.url || cfg.author?.homepage || 'https://keru.in/',
		},
		favicon: cfg.favicon || '/favicon.ico',
		language: cfg.language || 'zh-CN',
		timeEstablished: cfg.timeEstablished || '2025-11-10',
		timeZone: cfg.timeZone || 'Asia/Shanghai',
		url: cfg.url || 'https://keru.in/',
		defaultCategory: cfg.defaultCategory || '前端开发',
	}

	const article = cfg.article || {}
	const categories = { ...(article.categories || {}) }
	if (!categories[basic.defaultCategory]) {
		categories[basic.defaultCategory] = { icon: 'tabler:browser', color: '#33aaff' }
	}

	const types = article.types || { tech: {}, story: {} }
	const order = article.order || { date: '创建日期', updated: '更新日期' }
	const useRandomPremalink = Boolean(article.useRandomPremalink)
	const hidePostPrefix = article.hidePostPrefix !== undefined ? Boolean(article.hidePostPrefix) : true
	const robotsNotIndex = article.robotsNotIndex || ['/preview', '/previews/*']
	const feed = cfg.feed || { limit: 50, enableStyle: true }
	const scripts = cfg.scripts || []
	const twikoo = cfg.twikoo || { envId: '', preload: '' }

	let code = `import type { FeedEntry } from './src/types/feed'\n\n`
	code += `const basicConfig = {\n`
	code += `\ttitle: '${basic.title.replace(/'/g, '\\\'')}',\n`
	code += `\tsubtitle: '${basic.subtitle.replace(/'/g, '\\\'')}',\n`
	code += `\t// 长 description 利好于 SEO\n`
	code += `\tdescription: '${basic.description.replace(/'/g, '\\\'')}',\n`
	code += `\tauthor: {\n`
	code += `\t\tname: '${basic.author.name.replace(/'/g, '\\\'')}',\n`
	code += `\t\tavatar: '${basic.author.avatar.replace(/'/g, '\\\'')}',\n`
	code += `\t\temail: '${basic.author.email.replace(/'/g, '\\\'')}',\n`
	code += `\t\thomepage: '${basic.author.homepage.replace(/'/g, '\\\'')}',\n`
	code += `\t},\n`
	code += `\tcopyright: {\n`
	code += `\t\tabbr: '${basic.copyright.abbr.replace(/'/g, '\\\'')}',\n`
	code += `\t\tname: '${basic.copyright.name.replace(/'/g, '\\\'')}',\n`
	code += `\t\turl: '${basic.copyright.url.replace(/'/g, '\\\'')}',\n`
	code += `\t},\n`
	code += `\tfavicon: '${basic.favicon.replace(/'/g, '\\\'')}',\n`
	code += `\tlanguage: '${basic.language.replace(/'/g, '\\\'')}',\n`
	code += `\ttimeEstablished: '${basic.timeEstablished.replace(/'/g, '\\\'')}',\n`
	code += `\ttimeZone: '${basic.timeZone.replace(/'/g, '\\\'')}',\n`
	code += `\turl: '${basic.url.replace(/'/g, '\\\'')}',\n`
	code += `\tdefaultCategory: '${basic.defaultCategory.replace(/'/g, '\\\'')}',\n`
	code += `}\n\n`

	code += `// 存储 next.config 和 app.config 共用的配置\n`
	code += `// 此处为启动时需要的配置，启动后可变配置位于 src/app.config.ts\n`
	code += `// @keep-sorted\n`
	code += `const blogConfig = {\n`
	code += `\t...basicConfig,\n\n`
	code += `\tarticle: {\n`
	code += `\t\tcategories: {\n`
	code += `\t\t\t[basicConfig.defaultCategory]: { icon: '${categories[basic.defaultCategory]?.icon || 'tabler:browser'}', color: '${categories[basic.defaultCategory]?.color || '#33aaff'}' },\n`
	for (const [catName, catMeta] of Object.entries(categories)) {
		if (catName === basic.defaultCategory) continue
		code += `\t\t\t'${catName.replace(/'/g, '\\\'')}': { icon: '${(catMeta as any)?.icon || 'tabler:folder'}', color: '${(catMeta as any)?.color || '#33aaff'}' },\n`
	}
	code += `\t\t},\n`
	code += `\t\t/** 文章版式，首个为默认版式 */\n`
	code += `\t\ttypes: {\n`
	for (const t of Object.keys(types)) {
		code += `\t\t\t${t}: {},\n`
	}
	code += `\t\t},\n`
	code += `\t\t/** 分类排序方式，键为排序字段，值为显示名称 */\n`
	code += `\t\torder: {\n`
	for (const [k, v] of Object.entries(order)) {
		code += `\t\t\t${k}: '${String(v).replace(/'/g, '\\\'')}',\n`
	}
	code += `\t\t},\n`
	code += `\t\t/** 使用 pnpm new 新建文章时自动生成自定义链接（permalink/abbrlink） */\n`
	code += `\t\tuseRandomPremalink: ${useRandomPremalink},\n`
	code += `\t\t/** 隐藏基于文件路由（不是自定义链接）的 URL /post 路径前缀 */\n`
	code += `\t\thidePostPrefix: ${hidePostPrefix},\n`
	code += `\t\t/** 禁止搜索引擎收录的路径 */\n`
	code += `\t\trobotsNotIndex: [${robotsNotIndex.map((r: string) => `'${r.replace(/'/g, '\\\'')}'`).join(', ')}],\n`
	code += `\t},\n\n`

	code += `\t/** 博客 Atom 订阅源 */\n`
	code += `\tfeed: {\n`
	code += `\t\t/** 订阅源最大文章数量 */\n`
	code += `\t\tlimit: ${feed.limit || 50},\n`
	code += `\t\t/** 订阅源是否启用XSLT样式 */\n`
	code += `\t\tenableStyle: ${Boolean(feed.enableStyle)},\n`
	code += `\t},\n\n`

	code += `\t/** 向 <head> 中添加脚本 */\n`
	code += `\tscripts: [${scripts.map((s: string) => `'${s.replace(/'/g, '\\\'')}'`).join(', ')}],\n\n`

	code += `\t/** 自己部署的 Twikoo 服务 */\n`
	code += `\ttwikoo: {\n`
	code += `\t\tenvId: '${(twikoo.envId || '').replace(/'/g, '\\\'')}',\n`
	code += `\t\tpreload: '${(twikoo.preload || '').replace(/'/g, '\\\'')}',\n`
	code += `\t},\n`
	code += `}\n\n`

	const mf = myFeedData || {}
	code += `/** 用于生成 OPML 和友链页面配置 */\n`
	code += `export const myFeed: FeedEntry = {\n`
	code += `\tauthor: blogConfig.author.name,\n`
	code += `\tsitenick: '${(mf.sitenick || '').replace(/'/g, '\\\'')}',\n`
	code += `\ttitle: blogConfig.title,\n`
	code += `\tdesc: blogConfig.subtitle || blogConfig.description,\n`
	code += `\tlink: blogConfig.url,\n`
	code += `\tfeed: new URL('/atom.xml', blogConfig.url).toString(),\n`
	code += `\ticon: blogConfig.favicon,\n`
	code += `\tavatar: blogConfig.author.avatar,\n`
	const archs = Array.isArray(mf.archs) && mf.archs.length > 0 ? mf.archs : ['React', 'Rsbuild']
	code += `\tarchs: [${archs.map((a: string) => `'${a.replace(/'/g, '\\\'')}'`).join(', ')}],\n`
	code += `\tdate: blogConfig.timeEstablished,\n`
	code += `\tcomment: '${(mf.comment || '这是我自己').replace(/'/g, '\\\'')}',\n`
	code += `}\n\n`
	code += `export default blogConfig\n`

	return code
}

async function updateBlogConfigFile(updater: (currentBlog: any, currentMyFeed: any) => { blogConfig: any, myFeed: any }) {
	return runExclusiveConfigTask(async () => {
		const blogMod = await import(`../blog.config.ts?t=${Date.now()}`)
		const currentBlog = blogMod.default || {}
		const currentMyFeed = blogMod.myFeed || {}
		const { blogConfig: updatedBlog, myFeed: updatedMyFeed } = updater(currentBlog, currentMyFeed)
		const newTsCode = generateBlogConfigCode(updatedBlog, updatedMyFeed)
		safeWriteFileSync(blogConfigPath, newTsCode)
	})
}

// ==================== 审计日志与版本快照 ====================

interface AuditLogEntry {
	id: string
	timestamp: string
	action: string
	target: string
	details: string
	operator: string
}

function recordAuditLog(action: string, target: string, details: string, operator = 'Admin') {
	try {
		if (!fs.existsSync(dataDir)) {
			fs.mkdirSync(dataDir, { recursive: true })
		}
		let logs: AuditLogEntry[] = []
		if (fs.existsSync(auditLogsPath)) {
			try {
				logs = JSON.parse(fs.readFileSync(auditLogsPath, 'utf-8'))
			}
			catch {
				logs = []
			}
		}
		const newEntry: AuditLogEntry = {
			id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			timestamp: Temporal.Now.plainDateTimeISO().toLocaleString('sv'),
			action,
			target,
			details,
			operator,
		}
		logs.unshift(newEntry)
		if (logs.length > 500) logs = logs.slice(0, 500)
		safeWriteFileSync(auditLogsPath, JSON.stringify(logs, null, 2))
	}
	catch (err) {
		console.error('记录审计日志失败:', err)
	}
}

function getAuditLogs(): AuditLogEntry[] {
	try {
		if (fs.existsSync(auditLogsPath)) {
			return JSON.parse(fs.readFileSync(auditLogsPath, 'utf-8'))
		}
	}
	catch (err) {
		console.error('读取审计日志失败:', err)
	}
	return []
}

function savePostSnapshot(postSlug: string, fullPath: string, content: string, frontmatter: any, remark = '自动保存') {
	try {
		const slugDir = path.join(snapshotsDir, postSlug)
		if (!fs.existsSync(slugDir)) {
			fs.mkdirSync(slugDir, { recursive: true })
		}
		const now = Temporal.Now.plainDateTimeISO().toLocaleString('sv').replace(/[: ]/g, '-')
		const snapshotFile = path.join(slugDir, `${now}.json`)
		const snapshotData = {
			slug: postSlug,
			filePath: fullPath,
			timestamp: Temporal.Now.plainDateTimeISO().toLocaleString('sv'),
			remark,
			frontmatter,
			content,
		}
		safeWriteFileSync(snapshotFile, JSON.stringify(snapshotData, null, 2))
	}
	catch (err) {
		console.error('保存文章快照失败:', err)
	}
}

function getPostSnapshots(postSlug: string) {
	try {
		const slugDir = path.join(snapshotsDir, postSlug)
		if (!fs.existsSync(slugDir)) return []
		const files = fs.readdirSync(slugDir).filter(f => f.endsWith('.json'))
		const snapshots: any[] = []
		for (const f of files) {
			try {
				const full = path.join(slugDir, f)
				const data = JSON.parse(fs.readFileSync(full, 'utf-8'))
				snapshots.push({
					fileName: f,
					...data,
				})
			}
			catch {}
		}
		return snapshots.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
	}
	catch (err) {
		console.error('获取快照列表失败:', err)
		return []
	}
}

// ==================== MDC 在线编译 ====================

async function compileMdxLive(rawSource: string, title?: string) {
	const source = preprocessMdc(rawSource)
	const slugger = new GithubSlugger()
	const toc: Array<{ depth: number, text: string, id: string }> = []
	let isFirstHeading = true

	const compiled = await compile(source, {
		outputFormat: 'function-body',
		development: false,
		remarkPlugins: [
			remarkMath,
			() => (tree: any) => {
				tree.children = tree.children.filter((node: any) => {
					if (node.type === 'heading' && isFirstHeading) {
						isFirstHeading = false
						if (node.depth === 1) {
							const text = (node.children || []).map((c: any) => c.value || '').join('').trim()
							if (!title || text === title.trim()) {
								return false
							}
						}
					}
					return true
				})

				visit(tree, 'heading', (node: any) => {
					const text = node.children
						.map((c: any) => c.value || '')
						.join('')
					const id = slugger.slug(text)
					toc.push({
						depth: node.depth,
						text,
						id,
					})
				})
			},
		],
		rehypePlugins: [
			rehypeKatex,
		],
	})

	return {
		compiledCode: String(compiled.value),
		toc,
	}
}

// ==================== 文章操作 ====================

interface PostMeta {
	path: string
	relativePath: string
	slug: string
	title: string
	description?: string
	date?: string
	updated?: string
	categories?: string[]
	tags?: string[]
	type?: string
	draft?: boolean
	permalink?: string
	wordCount: number
	readingMinutes: number
	image?: string
}

function getAllPostsMeta(): PostMeta[] {
	const files = walkDir(contentPostsDir)
	const list: PostMeta[] = []

	for (const fullPath of files) {
		try {
			const relativePath = path.relative(contentPostsDir, fullPath).replace(/\\/g, '/')
			const raw = fs.readFileSync(fullPath, 'utf-8')
			const parsed = matter(raw)
			const slug = path.basename(fullPath).replace(/\.(?:md|mdx)$/i, '')
			const fm = normalizeFrontmatter(parsed.data || {})
			const stats = calculatePostStats(parsed.content)

			list.push({
				path: fullPath,
				relativePath,
				slug,
				title: fm.title || slug,
				description: fm.description || '',
				date: fm.date || '',
				updated: fm.updated || '',
				categories: fm.categories,
				tags: fm.tags,
				type: fm.type,
				draft: fm.draft,
				permalink: fm.permalink,
				image: fm.image,
				wordCount: stats.totalWords,
				readingMinutes: stats.readingMinutes,
			})
		}
		catch (e) {
			console.error(`解析文章失败: ${fullPath}`, e)
		}
	}

	list.sort((a, b) => {
		const da = a.date || ''
		const db = b.date || ''
		return db.localeCompare(da)
	})

	return list
}

// ==================== 友链解析与写回 ====================

interface FeedItem {
	id: string
	author: string
	sitenick?: string
	title?: string
	desc?: string
	link: string
	feed?: string
	icon?: string
	avatar?: string
	archs?: string[]
	date?: string
	comment?: string
}

interface FeedGroupData {
	name: string
	desc?: string
	entries: FeedItem[]
}

async function getFeedsData(): Promise<FeedGroupData[]> {
	try {
		const feedsModule = await import(`../src/feeds.ts?t=${Date.now()}`)
		const rawGroups = feedsModule.default || []
		return rawGroups.map((g: any) => ({
			name: g.name,
			desc: g.desc,
			entries: (g.entries || []).map((e: any) => ({
				id: `${e.link || e.author}-${Math.random().toString(36).slice(2, 7)}`,
				author: e.author,
				sitenick: e.sitenick,
				title: e.title,
				desc: e.desc,
				link: e.link,
				feed: e.feed,
				icon: e.icon,
				avatar: e.avatar,
				archs: e.archs,
				date: e.date,
				comment: e.comment,
			})),
		}))
	}
	catch (err) {
		console.error('动态读取 feeds 失败', err)
		return []
	}
}

function serializeFeedsToFile(groups: FeedGroupData[]) {
	let tsCode = `import type { FeedGroup } from './types/feed'
// 友链检测 CLI 需要使用显式导入和相对路径
import { myFeed } from '../blog.config'
import { getFavicon, getGithubAvatar, getGithubIcon, getOicqAvatar, OicqAvatarSize } from './utils/img'

export default [
`

	for (const g of groups) {
		tsCode += `\t// #region ${g.name}\n`
		tsCode += `\t{\n`
		tsCode += `\t\tname: '${g.name.replace(/'/g, '\\\'')}',\n`
		if (g.desc) {
			tsCode += `\t\tdesc: '${g.desc.replace(/'/g, '\\\'')}',\n`
		}
		tsCode += `\t\t// @keep-sorted { "keys": ["date"] }\n`
		tsCode += `\t\tentries: [\n`

		for (const entry of g.entries) {
			if (entry.author === 'kerntau' || entry.comment === '这是我自己') {
				tsCode += `\t\t\tmyFeed,\n`
				continue
			}
			tsCode += `\t\t\t{\n`
			tsCode += `\t\t\t\tauthor: '${(entry.author || '').replace(/'/g, '\\\'')}',\n`
			if (entry.sitenick) tsCode += `\t\t\t\tsitenick: '${entry.sitenick.replace(/'/g, '\\\'')}',\n`
			if (entry.title) tsCode += `\t\t\t\ttitle: '${entry.title.replace(/'/g, '\\\'')}',\n`
			if (entry.desc) tsCode += `\t\t\t\tdesc: '${entry.desc.replace(/'/g, '\\\'')}',\n`
			if (entry.link) tsCode += `\t\t\t\tlink: '${entry.link.replace(/'/g, '\\\'')}',\n`
			if (entry.feed) tsCode += `\t\t\t\tfeed: '${entry.feed.replace(/'/g, '\\\'')}',\n`
			if (entry.icon) tsCode += `\t\t\t\ticon: '${entry.icon.replace(/'/g, '\\\'')}',\n`
			if (entry.avatar) tsCode += `\t\t\t\tavatar: '${entry.avatar.replace(/'/g, '\\\'')}',\n`
			if (entry.archs && entry.archs.length > 0) {
				tsCode += `\t\t\t\tarchs: [${entry.archs.map(a => `'${a.replace(/'/g, '\\\'')}'`).join(', ')}],\n`
			}
			if (entry.date) tsCode += `\t\t\t\tdate: '${entry.date}',\n`
			if (entry.comment) tsCode += `\t\t\t\tcomment: '${entry.comment.replace(/'/g, '\\\'')}',\n`
			tsCode += `\t\t\t},\n`
		}

		tsCode += `\t\t],\n`
		tsCode += `\t},\n`
		tsCode += `\t// #endregion\n\n`
	}

	tsCode += `] satisfies FeedGroup[]\n`

	safeWriteFileSync(feedsFilePath, tsCode)
}

// ==================== 智能嗅探与网络检测 ====================

function fetchHttp(targetUrl: string, options: { timeout?: number, method?: string } = {}): Promise<{ status: number, headers: http.IncomingHttpHeaders, body: string, time: number }> {
	return new Promise((resolve, reject) => {
		const startTimeReq = Date.now()
		const parsedUrl = new URL(targetUrl)
		const isHttps = parsedUrl.protocol === 'https:'
		const client = isHttps ? https : http

		const req = client.request(targetUrl, {
			method: options.method || 'GET',
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 BlogAdmin/1.0',
				'Accept': 'text/html,application/xhtml+xml,application/xml,application/atom+xml;q=0.9,*/*;q=0.8',
			},
			timeout: options.timeout || 8000,
		}, (res) => {
			let body = ''
			res.on('data', chunk => body += chunk)
			res.on('end', () => {
				resolve({
					status: res.statusCode || 0,
					headers: res.headers,
					body,
					time: Date.now() - startTimeReq,
				})
			})
		})

		req.on('timeout', () => {
			req.destroy()
			reject(new Error('请求超时 (8s)'))
		})
		req.on('error', (err) => {
			reject(err)
		})
		req.end()
	})
}

async function sniffWebsiteMeta(urlStr: string) {
	try {
		if (!/^https?:\/\//i.test(urlStr)) {
			urlStr = `https://${urlStr}`
		}
		const res = await fetchHttp(urlStr, { timeout: 8000 })
		const html = res.body

		let title = ''
		const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
		if (titleMatch) {
			title = titleMatch[1].replace(/&ndash;|&mdash;|-|\||_.*$/i, '').trim()
		}

		let desc = ''
		const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
			|| html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)
			|| html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i)
		if (descMatch) {
			desc = descMatch[1].trim()
		}

		let icon = ''
		const iconMatch = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']*)["']/i)
			|| html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["'](?:shortcut )?icon["']/i)
		if (iconMatch) {
			const href = iconMatch[1].trim()
			icon = new URL(href, urlStr).toString()
		}
		else {
			icon = new URL('/favicon.ico', urlStr).toString()
		}

		let feed = ''
		const feedMatch = html.match(/<link[^>]+type=["']application\/(?:rss\+xml|atom\+xml)["'][^>]+href=["']([^"']*)["']/i)
		if (feedMatch) {
			feed = new URL(feedMatch[1].trim(), urlStr).toString()
		}

		const archs: string[] = []
		if (/react/i.test(html) || /_next/i.test(html)) archs.push('React')
		if (/_nuxt/i.test(html) || /nuxt/i.test(html)) archs.push('Nuxt')
		if (/astro/i.test(html)) archs.push('Astro')
		if (/hexo/i.test(html)) archs.push('Hexo')
		if (/hugo/i.test(html)) archs.push('Hugo')
		if (/vuepress|vitepress/i.test(html)) archs.push('VitePress')
		if (res.headers.server && /vercel/i.test(String(res.headers.server))) archs.push('Vercel')
		if (res.headers.server && /netlify/i.test(String(res.headers.server))) archs.push('Netlify')
		if (res.headers.server && /cloudflare/i.test(String(res.headers.server))) archs.push('Cloudflare')

		return {
			success: true,
			url: urlStr,
			title,
			desc,
			icon,
			avatar: icon,
			feed,
			archs: Array.from(new Set(archs)),
		}
	}
	catch (err: any) {
		return {
			success: false,
			url: urlStr,
			error: err.message || '抓取失败',
		}
	}
}

// ==================== HTTP 请求路由派发 ====================

const server = http.createServer(async (req, res) => {
	const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
	const pathname = parsedUrl.pathname
	const method = req.method?.toUpperCase()

	// CORS 处理
	if (method === 'OPTIONS') {
		res.writeHead(204, {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		})
		res.end()
		return
	}

	try {
		// 0. GET /api/health - 服务韧性与心跳探测
		if (method === 'GET' && pathname === '/api/health') {
			sendJson(res, 200, {
				code: 0,
				data: {
					status: 'online',
					uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
					nodeVersion: process.version,
					port: PORT,
					rootDir,
				},
			})
			return
		}

		// 1. GET /api/stats - 概览数据与统计指标
		if (method === 'GET' && pathname === '/api/stats') {
			const posts = getAllPostsMeta()
			const feeds = await getFeedsData()
			const totalWords = posts.reduce((sum, p) => sum + p.wordCount, 0)
			const categoryCountMap: Record<string, number> = {}
			const tagCountMap: Record<string, number> = {}
			const yearCountMap: Record<string, number> = {}
			let draftCount = 0

			for (const p of posts) {
				if (p.draft) draftCount++
				for (const c of p.categories || []) {
					categoryCountMap[c] = (categoryCountMap[c] || 0) + 1
				}
				for (const t of p.tags || []) {
					tagCountMap[t] = (tagCountMap[t] || 0) + 1
				}
				if (p.date) {
					const year = p.date.slice(0, 4)
					yearCountMap[year] = (yearCountMap[year] || 0) + 1
				}
			}

			let totalFriends = 0
			for (const g of feeds) {
				totalFriends += g.entries.length
			}

			sendJson(res, 200, {
				code: 0,
				data: {
					postCount: posts.length,
					publishedCount: posts.length - draftCount,
					draftCount,
					totalWords,
					categoryCount: Object.keys(categoryCountMap).length,
					tagCount: Object.keys(tagCountMap).length,
					friendCount: totalFriends,
					categories: categoryCountMap,
					tags: tagCountMap,
					years: yearCountMap,
					lastUpdated: posts[0]?.updated || posts[0]?.date || '',
				},
			})
			return
		}

		// 2. GET /api/posts - 获取文章列表
		if (method === 'GET' && pathname === '/api/posts') {
			const posts = getAllPostsMeta()
			sendJson(res, 200, { code: 0, data: posts })
			return
		}

		// 3. GET /api/posts/detail - 获取文章详情
		if (method === 'GET' && pathname === '/api/posts/detail') {
			const filePathParam = parsedUrl.searchParams.get('path')
			if (!filePathParam) {
				sendJson(res, 400, { code: 400, message: '必须指定 path 参数' })
				return
			}
			const targetPath = path.isAbsolute(filePathParam)
				? filePathParam
				: path.join(contentPostsDir, filePathParam)

			if (!fs.existsSync(targetPath)) {
				sendJson(res, 404, { code: 404, message: `文件不存在: ${filePathParam}` })
				return
			}

			const raw = fs.readFileSync(targetPath, 'utf-8')
			const parsed = matter(raw)
			sendJson(res, 200, {
				code: 0,
				data: {
					path: targetPath,
					relativePath: path.relative(contentPostsDir, targetPath).replace(/\\/g, '/'),
					frontmatter: parsed.data,
					content: parsed.content,
				},
			})
			return
		}

		// 4. POST /api/posts/save - 保存与更新文章并备份快照
		if (method === 'POST' && pathname === '/api/posts/save') {
			const body = await parseJsonBody<{ path: string, frontmatter: any, content: string }>(req)
			if (!body.path) {
				sendJson(res, 400, { code: 400, message: '必须提供文章路径' })
				return
			}

			const targetPath = path.isAbsolute(body.path)
				? body.path
				: path.join(contentPostsDir, body.path)

			const dir = path.dirname(targetPath)
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true })
			}

			const fm = body.frontmatter || {}
			const now = Temporal.Now.plainDateTimeISO().toLocaleString('sv')
			fm.updated = now

			const slug = path.basename(targetPath).replace(/\.(?:md|mdx)$/i, '')
			savePostSnapshot(slug, targetPath, body.content || '', fm, '手动保存')

			const fileContent = matter.stringify(body.content || '', fm)
			safeWriteFileSync(targetPath, fileContent)

			recordAuditLog('修改文章', fm.title || slug, `保存并更新了文章《${fm.title || slug}》`)
			triggerStaticBuild()

			sendJson(res, 200, {
				code: 0,
				message: '保存成功',
				data: {
					path: targetPath,
					updated: now,
				},
			})
			return
		}

		// 5. POST /api/posts/create - 新建文章
		if (method === 'POST' && pathname === '/api/posts/create') {
			const body = await parseJsonBody<{
				title: string
				slug?: string
				category?: string
				tags?: string[]
				type?: string
				year?: string
				permalink?: string
				description?: string
				content?: string
			}>(req)

			if (!body.title) {
				sendJson(res, 400, { code: 400, message: '文章标题不能为空' })
				return
			}

			const now = Temporal.Now.plainDateTimeISO()
			const yearStr = body.year || now.year.toString()
			const dateStr = now.toLocaleString('sv')
			const slug = (body.slug || body.title)
				.trim()
				.toLowerCase()
				.replace(/[\s/\\?%*:|"<>]/g, '-')
				.replace(/-+/g, '-')

			const targetDir = path.join(contentPostsDir, yearStr)
			if (!fs.existsSync(targetDir)) {
				fs.mkdirSync(targetDir, { recursive: true })
			}

			const targetPath = path.join(targetDir, `${slug}.mdx`)
			if (fs.existsSync(targetPath)) {
				sendJson(res, 409, { code: 409, message: `该文件已存在: ${slug}.mdx` })
				return
			}

			const fm: any = {
				title: body.title,
				description: body.description || `关于 ${body.title} 的文章记录`,
				date: dateStr,
				updated: dateStr,
				image: '# 封面图推荐 2:1',
				type: body.type === 'tech' ? undefined : body.type,
				categories: body.category ? `[${body.category}]` : undefined,
				tags: body.tags && body.tags.length > 0 ? `[${body.tags.join(', ')}]` : undefined,
				permalink: body.permalink || undefined,
			}

			const initialContent = body.content || `\n## 从 ${body.title} 开始\n\n在此书写你的思考与记录...\n`
			const fileData = matter.stringify(initialContent, fm)
			safeWriteFileSync(targetPath, fileData)

			savePostSnapshot(slug, targetPath, initialContent, fm, '新建初始版本')
			recordAuditLog('创建文章', body.title, `创建新文章《${body.title}》`)
			triggerStaticBuild()

			sendJson(res, 200, {
				code: 0,
				message: '创建文章成功',
				data: {
					path: targetPath,
					relativePath: path.relative(contentPostsDir, targetPath).replace(/\\/g, '/'),
					slug,
				},
			})
			return
		}

		// 6. POST /api/posts/delete - 删除文章
		if (method === 'POST' && pathname === '/api/posts/delete') {
			const body = await parseJsonBody<{ path: string }>(req)
			if (!body.path) {
				sendJson(res, 400, { code: 400, message: '必须提供文章路径' })
				return
			}

			const targetPath = path.isAbsolute(body.path)
				? body.path
				: path.join(contentPostsDir, body.path)

			if (!fs.existsSync(targetPath)) {
				sendJson(res, 404, { code: 404, message: '文章文件不存在' })
				return
			}

			fs.unlinkSync(targetPath)
			recordAuditLog('删除文章', path.basename(targetPath), `删除了文章 ${path.basename(targetPath)}`)
			triggerStaticBuild()
			sendJson(res, 200, { code: 0, message: '文章已安全删除' })
			return
		}

		// 7. POST /api/posts/compile - 即时 MDX 在线同源编译 (供前台同源实时渲染)
		if (method === 'POST' && pathname === '/api/posts/compile') {
			const body = await parseJsonBody<{ content: string, title?: string }>(req)
			try {
				const result = await compileMdxLive(body.content || '', body.title)
				sendJson(res, 200, {
					code: 0,
					data: result,
				})
			}
			catch (err: any) {
				sendJson(res, 200, {
					code: 1,
					error: err.message,
					data: {
						compiledCode: '',
						toc: [],
					},
				})
			}
			return
		}

		// 8. POST /api/posts/validate - 单篇 MDX 语法静态校验
		if (method === 'POST' && pathname === '/api/posts/validate') {
			const body = await parseJsonBody<{ content: string }>(req)
			try {
				await compile(body.content || '', {
					remarkPlugins: [remarkMath],
					rehypePlugins: [rehypeKatex],
				})
				sendJson(res, 200, {
					code: 0,
					data: { valid: true, message: 'MDX 语法解析通过，无语法错误' },
				})
			}
			catch (err: any) {
				sendJson(res, 200, {
					code: 0,
					data: {
						valid: false,
						error: err.message,
						line: err.line || err.position?.start?.line,
						column: err.column || err.position?.start?.column,
					},
				})
			}
			return
		}

		// 9. GET /api/posts/history - 获取文章历史版本快照
		if (method === 'GET' && pathname === '/api/posts/history') {
			const slugParam = parsedUrl.searchParams.get('slug')
			if (!slugParam) {
				sendJson(res, 400, { code: 400, message: '必须指定 slug' })
				return
			}
			const snapshots = getPostSnapshots(slugParam)
			sendJson(res, 200, { code: 0, data: snapshots })
			return
		}

		// 10. POST /api/posts/history/restore - 恢复文章历史版本
		if (method === 'POST' && pathname === '/api/posts/history/restore') {
			const body = await parseJsonBody<{ slug: string, snapshotFileName: string }>(req)
			if (!body.slug || !body.snapshotFileName) {
				sendJson(res, 400, { code: 400, message: '缺少参数' })
				return
			}
			const snapshotFile = path.join(snapshotsDir, body.slug, body.snapshotFileName)
			if (!fs.existsSync(snapshotFile)) {
				sendJson(res, 404, { code: 404, message: '快照文件不存在' })
				return
			}
			const snapshotData = JSON.parse(fs.readFileSync(snapshotFile, 'utf-8'))
			const targetPath = snapshotData.filePath
			const fileContent = matter.stringify(snapshotData.content || '', snapshotData.frontmatter || {})
			safeWriteFileSync(targetPath, fileContent)

			recordAuditLog('恢复历史版本', body.slug, `恢复文章《${body.slug}》到快照 ${snapshotData.timestamp}`)
			triggerStaticBuild()

			sendJson(res, 200, {
				code: 0,
				message: '已成功恢复至指定历史快照',
				data: snapshotData,
			})
			return
		}

		// 11. POST /api/posts/batch - 批量文章操作
		if (method === 'POST' && pathname === '/api/posts/batch') {
			const body = await parseJsonBody<{
				action: 'category' | 'draft' | 'delete'
				paths: string[]
				category?: string
				draft?: boolean
			}>(req)

			const paths = Array.isArray(body.paths) ? body.paths : []
			let modifiedCount = 0

			for (const p of paths) {
				const fullPath = path.isAbsolute(p) ? p : path.join(contentPostsDir, p)
				if (!fs.existsSync(fullPath)) continue

				if (body.action === 'delete') {
					fs.unlinkSync(fullPath)
					modifiedCount++
				}
				else if (body.action === 'category' && body.category) {
					const raw = fs.readFileSync(fullPath, 'utf-8')
					const parsed = matter(raw)
					parsed.data.categories = `[${body.category}]`
					parsed.data.updated = Temporal.Now.plainDateTimeISO().toLocaleString('sv')
					safeWriteFileSync(fullPath, matter.stringify(parsed.content, parsed.data))
					modifiedCount++
				}
				else if (body.action === 'draft' && body.draft !== undefined) {
					const raw = fs.readFileSync(fullPath, 'utf-8')
					const parsed = matter(raw)
					if (body.draft) {
						parsed.data.draft = true
					}
					else {
						delete parsed.data.draft
					}
					parsed.data.updated = Temporal.Now.plainDateTimeISO().toLocaleString('sv')
					safeWriteFileSync(fullPath, matter.stringify(parsed.content, parsed.data))
					modifiedCount++
				}
			}

			recordAuditLog('批量操作', `${body.action}`, `对 ${modifiedCount} 篇文章执行了批量 ${body.action} 操作`)
			triggerStaticBuild()

			sendJson(res, 200, {
				code: 0,
				message: `批量操作完成，共处理 ${modifiedCount} 篇文章`,
				data: { modifiedCount },
			})
			return
		}

		// 12. POST /api/posts/open-vscode - 调用 VS Code 打开
		if (method === 'POST' && pathname === '/api/posts/open-vscode') {
			const body = await parseJsonBody<{ path: string }>(req)
			const targetPath = body.path ? path.resolve(body.path) : rootDir
			exec(`code "${targetPath}"`, (err) => {
				if (err) {
					sendJson(res, 500, { code: 500, message: `调用 VS Code 失败: ${err.message}` })
					return
				}
				sendJson(res, 200, { code: 0, message: '已在 VS Code 中打开' })
			})
			return
		}

		// 13. GET /api/categories - 分类管理
		if (method === 'GET' && pathname === '/api/categories') {
			const blogModule = await import(`../blog.config.ts?t=${Date.now()}`)
			const configCategories = blogModule.default?.article?.categories || {}
			const posts = getAllPostsMeta()

			const categoryStats: Record<string, { count: number, posts: Array<{ title: string, path: string, slug: string }> }> = {}
			for (const p of posts) {
				for (const c of p.categories || ['未分类']) {
					if (!categoryStats[c]) {
						categoryStats[c] = { count: 0, posts: [] }
					}
					categoryStats[c].count++
					categoryStats[c].posts.push({ title: p.title, path: p.path, slug: p.slug })
				}
			}

			const list = Object.entries(configCategories).map(([name, conf]: [string, any]) => ({
				name,
				icon: conf.icon || 'tabler:folder',
				color: conf.color || '#33aaff',
				count: categoryStats[name]?.count || 0,
				posts: categoryStats[name]?.posts || [],
			}))

			// 补充未在配置中注册但在文章中实际引用的分类
			for (const [name, stats] of Object.entries(categoryStats)) {
				if (!configCategories[name]) {
					list.push({
						name,
						icon: 'tabler:circle-dashed',
						color: '#888888',
						count: stats.count,
						posts: stats.posts,
					})
				}
			}

			sendJson(res, 200, { code: 0, data: list })
			return
		}

		// 14. POST /api/categories/save - 保存分类配置
		if (method === 'POST' && pathname === '/api/categories/save') {
			const body = await parseJsonBody<{ categories: Array<{ name: string, icon: string, color: string }> }>(req)
			if (!Array.isArray(body.categories)) {
				sendJson(res, 400, { code: 400, message: 'categories 必须是数组' })
				return
			}

			await updateBlogConfigFile((currentBlog, currentMyFeed) => {
				const article = { ...currentBlog.article }
				const newCategories: Record<string, { icon: string, color: string }> = {}
				for (const c of body.categories) {
					newCategories[c.name] = { icon: c.icon, color: c.color }
				}
				article.categories = newCategories
				return {
					blogConfig: {
						...currentBlog,
						article,
					},
					myFeed: currentMyFeed,
				}
			})

			recordAuditLog('修改分类', 'blog.config.ts', `更新了 ${body.categories.length} 个分类定义`)
			triggerStaticBuild()

			sendJson(res, 200, { code: 0, message: '分类配置已保存生效' })
			return
		}

		// 15. GET /api/tags - 获取标签列表
		if (method === 'GET' && pathname === '/api/tags') {
			const posts = getAllPostsMeta()
			const tagMap: Record<string, { count: number, posts: Array<{ title: string, path: string, slug: string }> }> = {}

			for (const p of posts) {
				for (const t of p.tags || []) {
					if (!tagMap[t]) {
						tagMap[t] = { count: 0, posts: [] }
					}
					tagMap[t].count++
					tagMap[t].posts.push({ title: p.title, path: p.path, slug: p.slug })
				}
			}

			const list = Object.entries(tagMap).map(([name, val]) => ({
				name,
				count: val.count,
				posts: val.posts,
			})).sort((a, b) => b.count - a.count)

			sendJson(res, 200, { code: 0, data: list })
			return
		}

		// 16. POST /api/tags/rename - 批量重命名标签
		if (method === 'POST' && pathname === '/api/tags/rename') {
			const body = await parseJsonBody<{ oldName: string, newName: string }>(req)
			if (!body.oldName || !body.newName) {
				sendJson(res, 400, { code: 400, message: '必须指定原标签和新标签' })
				return
			}
			const files = walkDir(contentPostsDir)
			let affectedCount = 0

			for (const f of files) {
				const content = fs.readFileSync(f, 'utf-8')
				const parsed = matter(content)
				const tags = parseArrayField(parsed.data.tags)
				if (tags.includes(body.oldName)) {
					const newTags = tags.map(t => t === body.oldName ? body.newName : t)
					parsed.data.tags = `[${Array.from(new Set(newTags)).join(', ')}]`
					parsed.data.updated = Temporal.Now.plainDateTimeISO().toLocaleString('sv')
					safeWriteFileSync(f, matter.stringify(parsed.content, parsed.data))
					affectedCount++
				}
			}

			recordAuditLog('重命名标签', `${body.oldName} -> ${body.newName}`, `更新了 ${affectedCount} 篇文章的标签`)
			triggerStaticBuild()

			sendJson(res, 200, { code: 0, message: `已重命名标签，影响 ${affectedCount} 篇文章` })
			return
		}

		// 17. GET /api/nav - 导航与页脚配置 (全量读取)
		if (method === 'GET' && pathname === '/api/nav') {
			const appConfigModule = await import(`../src/app.config.ts?t=${Date.now()}`)
			const nav = appConfigModule.default?.nav || []
			const footerNav = appConfigModule.default?.footer?.nav || []
			const iconNav = appConfigModule.default?.footer?.iconNav || []
			const copyright = appConfigModule.default?.footer?.copyright || ''

			sendJson(res, 200, {
				code: 0,
				data: {
					nav,
					footerNav,
					iconNav,
					copyright,
				},
			})
			return
		}

		// 18. POST /api/nav/save - 保存全量导航与页脚配置
		if (method === 'POST' && pathname === '/api/nav/save') {
			const body = await parseJsonBody<{ nav?: any[], footerNav?: any[], iconNav?: any[], copyright?: string }>(req)

			await updateAppConfigFile((current) => {
				const footer = { ...current.footer }

				if (body.iconNav && Array.isArray(body.iconNav)) {
					footer.iconNav = body.iconNav
				}
				if (body.footerNav && Array.isArray(body.footerNav)) {
					footer.nav = body.footerNav
				}
				if (body.copyright !== undefined) {
					footer.copyright = body.copyright
				}

				return {
					...current,
					nav: body.nav && Array.isArray(body.nav) ? body.nav : (current.nav || []),
					footer,
				}
			})

			recordAuditLog('修改导航与页脚', 'app.config.ts', '保存更新了侧栏菜单、底部社交图标与页脚站点地图')

			sendJson(res, 200, { code: 0, message: '全量导航、社交图标与页脚站点地图配置已更新保存！' })
			return
		}

		// 19. GET /api/widgets - 侧边栏挂件管理器 (全量数据读取)
		if (method === 'GET' && pathname === '/api/widgets') {
			const appConfigModule = await import(`../src/app.config.ts?t=${Date.now()}`)
			const statsConfig = appConfigModule.default?.component?.stats || { birthYear: 2006, wordCount: '约12万' }
			const rawWidgets = appConfigModule.default?.widgets || {}

			const availableWidgets = [
				{ id: 'blog-weather', name: '心知天气 (BlogWeather)', icon: 'tabler:cloud-sun', description: '展示实时天气现象、气温与未来3天逐日预报' },
				{ id: 'blog-stats', name: '博客统计 (BlogStats)', icon: 'tabler:chart-bar', description: '展示博文篇数、字数及建站年份' },
				{ id: 'blog-tech', name: '技术栈矩阵 (BlogTech)', icon: 'tabler:stack-2', description: '前台技术体系与架构徽标展示' },
				{ id: 'comm-group', name: '社区交流群 (CommGroup)', icon: 'tabler:users', description: 'QQ/微信交流群与二维码' },
				{ id: 'blog-log', name: '更新动态 (BlogLog)', icon: 'tabler:notes', description: '博客更新日志与大事记' },
				{ id: 'toc', name: '文章目录大纲 (Toc)', icon: 'tabler:list-tree', description: '文章详情页 H1-H6 目录导航' },
			]

			const pageAsideMappings = rawWidgets.pageAsideMappings || {
				home: ['blog-weather', 'blog-stats', 'blog-tech', 'comm-group'],
				archive: ['blog-stats', 'blog-log'],
				post: ['toc'],
				link: ['blog-stats', 'comm-group'],
			}

			const weather = rawWidgets.weather || {
				title: '实时天气',
				apiKey: 'SvyX4Wvh0a',
				defaultCity: 'beijing',
				unit: 'c',
			}

			const tech = rawWidgets.tech || {
				title: '技术信息',
				services: [
					{ label: '部署平台', value: 'EdgeOne', icon: 'ri:tencent-cloud-fill', iconColor: '#0052D9' },
					{ label: '图片存储', value: 'Cloudflare R2', icon: 'devicon:cloudflare', iconColor: '' },
					{ label: '开源协议', value: 'MIT', icon: 'tabler:license', iconColor: '#F59E0B' },
					{ label: '文章许可', value: 'CC BY-NC-SA 4.0', icon: 'tabler:creative-commons', iconColor: '#10B981' },
					{ label: '规范域名', value: 'cot.wiki', icon: 'tabler:link', iconColor: '#6366F1' },
				],
				techstack: [
					{ name: 'React', version: '^19.1.0', icon: 'logos:react', iconColor: '' },
					{ name: 'Rsbuild', version: '^2.1.13', icon: 'tabler:bolt', iconColor: '#F85D00' },
					{ name: 'TS', version: '^6.0.3', icon: 'logos:typescript-icon', iconColor: '' },
					{ name: 'MDX', version: '^3.1.1', icon: 'simple-icons:mdx', iconColor: '#FCB32C' },
					{ name: 'Node', version: '^22.17', icon: 'logos:nodejs-icon', iconColor: '' },
					{ name: 'pnpm', version: '11.0.4', icon: 'logos:pnpm', iconColor: '' },
					{ name: 'Motion', version: '^12.38.0', icon: 'simple-icons:framer', iconColor: '#0055FF' },
					{ name: 'Sass', version: '^1.99.0', icon: 'logos:sass', iconColor: '' },
				],
			}

			const commGroup = rawWidgets.commGroup || {
				title: '博客/技术社区',
				groupName: '序栈接入点',
				account: '1722288011',
				icon: 'ri:qq-fill',
				bgImg: '',
			}

			const log = rawWidgets.log || {
				title: '更新日志',
				items: [
					{ date: '2025-07-26', content: '重构至 React 19 + Rsbuild，迁移架构' },
					{ date: '2024-08-11', content: '重构至 Next.js / Content 架构' },
					{ date: '2023-05-24', content: '迁移为 Hexo，使用 Butterfly 主题' },
					{ date: '2020-08-24', content: '使用 blog 独立域名' },
				],
			}

			sendJson(res, 200, {
				code: 0,
				data: {
					availableWidgets,
					pageAsideMappings,
					statsConfig,
					weather,
					tech,
					commGroup,
					log,
				},
			})
			return
		}

		// 19.1 POST /api/widgets/save - 保存全量挂件配置
		if (method === 'POST' && pathname === '/api/widgets/save') {
			const body = await parseJsonBody<{
				pageAsideMappings?: Record<string, string[]>
				weather?: any
				tech?: any
				commGroup?: any
				log?: any
				statsConfig?: { birthYear?: number, wordCount?: string }
			}>(req)

			await updateAppConfigFile((current) => {
				const widgets = { ...current.widgets }
				const component = { ...current.component }
				const stats = { ...component.stats }

				if (body.pageAsideMappings) {
					widgets.pageAsideMappings = body.pageAsideMappings
				}
				if (body.weather) {
					widgets.weather = body.weather
				}
				if (body.tech) {
					widgets.tech = body.tech
				}
				if (body.commGroup) {
					widgets.commGroup = body.commGroup
				}
				if (body.log) {
					widgets.log = body.log
				}
				if (body.statsConfig) {
					if (body.statsConfig.birthYear !== undefined) {
						stats.birthYear = Number(body.statsConfig.birthYear)
					}
					if (body.statsConfig.wordCount !== undefined) {
						stats.wordCount = body.statsConfig.wordCount
					}
					component.stats = stats
				}

				return {
					...current,
					component,
					widgets,
				}
			})

			recordAuditLog('修改挂件配置', 'src/app.config.ts', '保存更新了侧边栏挂件内容与页面排布')
			sendJson(res, 200, { code: 0, message: '挂件配置与卡片内容已成功保存生效！' })
			return
		}

		// 19.12 GET /api/weather - 心知天气实况代理
		if (method === 'GET' && pathname === '/api/weather') {
			const loc = (parsedUrl.searchParams.get('location') || 'ip').trim()
			const appConfigModule = await import(`../src/app.config.ts?t=${Date.now()}`)
			const apiKey = appConfigModule.default?.widgets?.weather?.apiKey || 'SETN6ufSUnD0sxHTo'
			try {
				const resp = await fetch(`https://api.seniverse.com/v3/weather/now.json?key=${apiKey}&location=${encodeURIComponent(loc)}&language=zh-Hans&unit=c`)
				const json = await resp.json()
				sendJson(res, resp.status, json)
			} catch (err: any) {
				sendJson(res, 500, { code: 500, message: `心知天气请求异常: ${err.message}` })
			}
			return
		}

		// 19.13 GET /api/weather/daily - 心知天气逐日预报代理
		if (method === 'GET' && pathname === '/api/weather/daily') {
			const loc = (parsedUrl.searchParams.get('location') || 'ip').trim()
			const appConfigModule = await import(`../src/app.config.ts?t=${Date.now()}`)
			const apiKey = appConfigModule.default?.widgets?.weather?.apiKey || 'SETN6ufSUnD0sxHTo'
			try {
				const resp = await fetch(`https://api.seniverse.com/v3/weather/daily.json?key=${apiKey}&location=${encodeURIComponent(loc)}&language=zh-Hans&unit=c&start=0&days=3`)
				const json = await resp.json()
				sendJson(res, resp.status, json)
			} catch (err: any) {
				sendJson(res, 500, { code: 500, message: `心知天气逐日预报请求异常: ${err.message}` })
			}
			return
		}

		// 19.15 GET /api/appearance - 获取主题外观与排版配置
		if (method === 'GET' && pathname === '/api/appearance') {
			const appConfigModule = await import(`../src/app.config.ts?t=${Date.now()}`)
			const comp = appConfigModule.default?.component || {}
			const pag = appConfigModule.default?.pagination || {}
			const themes = appConfigModule.default?.themes || {}

			sendJson(res, 200, {
				code: 0,
				data: {
					alert: comp.alert || { defaultStyle: 'card' },
					codeblock: comp.codeblock || { triggerRows: 32, collapsedRows: 16, enableIndentGuide: true, indent: 4, tabSize: 3 },
					excerpt: comp.excerpt || { animation: true, caret: '_' },
					slide: comp.slide || { showTitle: true },
					pagination: pag || { perPage: 10, sortOrder: 'date', allowAscending: false },
					themes: themes || {},
				},
			})
			return
		}

		// 19.16 POST /api/appearance/save - 保存主题外观与排版配置
		if (method === 'POST' && pathname === '/api/appearance/save') {
			const body = await parseJsonBody<{
				alert?: { defaultStyle: 'card' | 'flat' }
				codeblock?: { triggerRows: number, collapsedRows: number, enableIndentGuide: boolean, indent: number, tabSize: number }
				excerpt?: { animation: boolean, caret: string }
				slide?: { showTitle: boolean }
				pagination?: { perPage: number, sortOrder: string, allowAscending: boolean }
				themes?: any
			}>(req)

			await updateAppConfigFile((current) => {
				const component = { ...current.component }
				const pagination = { ...current.pagination }
				const themes = { ...current.themes }

				if (body.alert) {
					component.alert = { ...component.alert, ...body.alert }
				}
				if (body.codeblock) {
					component.codeblock = { ...component.codeblock, ...body.codeblock }
				}
				if (body.excerpt) {
					component.excerpt = { ...component.excerpt, ...body.excerpt }
				}
				if (body.slide) {
					component.slide = { ...component.slide, ...body.slide }
				}
				if (body.pagination) {
					Object.assign(pagination, body.pagination)
				}
				if (body.themes) {
					Object.assign(themes, body.themes)
				}

				return {
					...current,
					component,
					pagination,
					themes,
				}
			})

			recordAuditLog('修改主题与外观', 'src/app.config.ts', '更新了提示框风格、代码块参数与摘要动画配置')
			sendJson(res, 200, { code: 0, message: '主题外观与排版参数已成功保存生效！' })
			return
		}

		// 19.2 GET /api/site-info - 获取全站信息与头像Emoji配置
		if (method === 'GET' && pathname === '/api/site-info') {
			const blogMod = await import(`../blog.config.ts?t=${Date.now()}`)
			const appMod = await import(`../src/app.config.ts?t=${Date.now()}`)
			const blog = blogMod.default || {}
			const app = appMod.default || {}

			// 从 iconNav 与 author 提取社交链接
			let githubUrl = ''
			let bilibiliUrl = ''
			let twitterUrl = ''

			for (const item of (app.footer?.iconNav || [])) {
				const u = item.url || ''
				if (u.includes('github.com')) githubUrl = u
				else if (u.includes('bilibili.com')) bilibiliUrl = u
				else if (u.includes('x.com') || u.includes('twitter.com')) twitterUrl = u
			}

			sendJson(res, 200, {
				code: 0,
				data: {
					title: blog.title || '序栈',
					subtitle: blog.subtitle || '',
					description: blog.description || '',
					authorName: blog.author?.name || 'kerntau',
					authorAvatar: blog.author?.avatar || '/avatar.webp',
					authorEmail: blog.author?.email || '',
					authorHomepage: blog.author?.homepage || '',
					url: blog.url || 'https://keru.in/',
					favicon: blog.favicon || '/favicon.ico',
					timeEstablished: blog.timeEstablished || '2025-11-10',
					timeZone: blog.timeZone || 'Asia/Shanghai',
					defaultCategory: blog.defaultCategory || '前端开发',
					copyrightAbbr: blog.copyright?.abbr || 'CC BY-NC-SA 4.0',
					emojiTail: app.header?.emojiTail || ['🌈', '☕', '💡', '🦄', '🎯'],
					logo: app.header?.logo || blog.author?.avatar || '/avatar.webp',
					githubUrl: githubUrl || 'https://github.com/kerntau',
					bilibiliUrl: bilibiliUrl || 'https://space.bilibili.com/9655855',
					twitterUrl: twitterUrl || 'https://x.com/Kerntao',
				},
			})
			return
		}

		// 19.3 POST /api/site-info/save - 保存全站信息与头像Emoji配置
		if (method === 'POST' && pathname === '/api/site-info/save') {
			const body = await parseJsonBody<{
				title?: string
				subtitle?: string
				description?: string
				authorName?: string
				authorAvatar?: string
				authorEmail?: string
				authorHomepage?: string
				url?: string
				favicon?: string
				timeEstablished?: string
				timeZone?: string
				defaultCategory?: string
				copyrightAbbr?: string
				emojiTail?: string[]
				logo?: string
				githubUrl?: string
				bilibiliUrl?: string
				twitterUrl?: string
			}>(req)

			await updateBlogConfigFile((currentBlog, currentMyFeed) => {
				const author = { ...currentBlog.author }
				const copyright = { ...currentBlog.copyright }

				if (body.authorName !== undefined) author.name = body.authorName
				if (body.authorAvatar !== undefined) author.avatar = body.authorAvatar
				if (body.authorEmail !== undefined) author.email = body.authorEmail
				if (body.authorHomepage !== undefined) author.homepage = body.authorHomepage

				if (body.copyrightAbbr !== undefined) copyright.abbr = body.copyrightAbbr
				if (body.authorHomepage !== undefined) copyright.url = body.authorHomepage
				if (body.url !== undefined) copyright.url = body.url

				const updatedBlog = {
					...currentBlog,
					author,
					copyright,
				}

				if (body.title !== undefined) updatedBlog.title = body.title
				if (body.subtitle !== undefined) updatedBlog.subtitle = body.subtitle
				if (body.description !== undefined) updatedBlog.description = body.description
				if (body.url !== undefined) updatedBlog.url = body.url
				if (body.favicon !== undefined) updatedBlog.favicon = body.favicon
				if (body.timeEstablished !== undefined) updatedBlog.timeEstablished = body.timeEstablished
				if (body.timeZone !== undefined) updatedBlog.timeZone = body.timeZone
				if (body.defaultCategory !== undefined) updatedBlog.defaultCategory = body.defaultCategory

				return { blogConfig: updatedBlog, myFeed: currentMyFeed }
			})

			await updateAppConfigFile((currentApp) => {
				const header = { ...currentApp.header }
				const footer = { ...currentApp.footer }
				const iconNav = [...(footer.iconNav || [])]

				if (body.emojiTail && Array.isArray(body.emojiTail)) {
					header.emojiTail = body.emojiTail
				}
				if (body.logo !== undefined) {
					header.logo = body.logo
				}
				if (body.subtitle !== undefined) {
					header.subtitle = body.subtitle
				}

				// 同步社交链接到 footer.iconNav
				if (body.githubUrl !== undefined) {
					const idx = iconNav.findIndex(i => i.icon.includes('github') || (Boolean(i.text) && i.text.toLowerCase().includes('github')))
					if (idx >= 0) {
						iconNav[idx] = { ...iconNav[idx], url: body.githubUrl, text: `GitHub: ${body.authorName || currentApp.author?.name || 'kerntau'}` }
					} else {
						iconNav.push({ icon: 'tabler:brand-github', text: 'GitHub', url: body.githubUrl })
					}
				}
				if (body.bilibiliUrl !== undefined) {
					const idx = iconNav.findIndex(i => i.icon.includes('bilibili') || (Boolean(i.text) && i.text.toLowerCase().includes('bilibili')))
					if (idx >= 0) {
						iconNav[idx] = { ...iconNav[idx], url: body.bilibiliUrl }
					} else {
						iconNav.push({ icon: 'ri:bilibili-line', text: 'Bilibili', url: body.bilibiliUrl })
					}
				}
				if (body.twitterUrl !== undefined) {
					const idx = iconNav.findIndex(i => i.icon.includes('twitter') || i.icon.includes('brand-x') || (Boolean(i.text) && (i.text.toLowerCase().includes('twitter') || i.text.toLowerCase().includes('x'))))
					if (idx >= 0) {
						iconNav[idx] = { ...iconNav[idx], url: body.twitterUrl }
					} else {
						iconNav.push({ icon: 'tabler:brand-twitter', text: 'X (Twitter)', url: body.twitterUrl })
					}
				}

				footer.iconNav = iconNav

				return {
					...currentApp,
					header,
					footer,
				}
			})

			recordAuditLog('修改站点与身份配置', 'blog.config.ts / app.config.ts', '更新了全站基础配置、博主头像、社交链接与 Emoji 动效')
			triggerStaticBuild()

			sendJson(res, 200, { code: 0, message: '全站信息、社交链接与头像 Emoji 配置已成功更新保存！' })
			return
		}

		// 20. GET /api/feeds - 获取友链列表
		if (method === 'GET' && pathname === '/api/feeds') {
			const feeds = await getFeedsData()
			sendJson(res, 200, { code: 0, data: feeds })
			return
		}

		// 21. POST /api/feeds/save - 保存友链文件
		if (method === 'POST' && pathname === '/api/feeds/save') {
			const body = await parseJsonBody<{ groups: FeedGroupData[] }>(req)
			if (!Array.isArray(body.groups)) {
				sendJson(res, 400, { code: 400, message: 'groups 必须是数组' })
				return
			}
			serializeFeedsToFile(body.groups)
			recordAuditLog('修改友链', 'src/feeds.ts', `保存更新了 ${body.groups.length} 个友链分组`)
			triggerStaticBuild()
			sendJson(res, 200, { code: 0, message: '友链数据已保存' })
			return
		}

		// 22. POST /api/feeds/sniff - 智能嗅探站点元数据
		if (method === 'POST' && pathname === '/api/feeds/sniff') {
			const body = await parseJsonBody<{ url: string }>(req)
			if (!body.url) {
				sendJson(res, 400, { code: 400, message: '必须提供 URL' })
				return
			}
			const result = await sniffWebsiteMeta(body.url)
			sendJson(res, 200, { code: 0, data: result })
			return
		}

		// 23. POST /api/feeds/check - 友链连通性检测
		if (method === 'POST' && pathname === '/api/feeds/check') {
			const body = await parseJsonBody<{ links: string[] }>(req)
			const links = Array.isArray(body.links) ? body.links : []
			const checkResults = await Promise.all(
				links.map(async (l) => {
					try {
						const resFetch = await fetchHttp(l, { timeout: 6000 })
						return {
							link: l,
							status: resFetch.status,
							ok: resFetch.status >= 200 && resFetch.status < 400,
							timeMs: resFetch.time,
						}
					}
					catch (err: any) {
						return {
							link: l,
							status: 0,
							ok: false,
							error: err.message,
						}
					}
				}),
			)
			sendJson(res, 200, { code: 0, data: checkResults })
			return
		}

		// 24. POST /api/feeds/import-opml - 导入 OPML 友链
		if (method === 'POST' && pathname === '/api/feeds/import-opml') {
			const body = await parseJsonBody<{ opmlContent: string, targetGroupName?: string }>(req)
			if (!body.opmlContent) {
				sendJson(res, 400, { code: 400, message: 'OPML 内容不能为空' })
				return
			}

			const outlineRegex = /<outline\s+([^>]+)>/gi
			const importedEntries: FeedItem[] = []
			const matches = Array.from(body.opmlContent.matchAll(outlineRegex))

			for (const match of matches) {
				const attrStr = match[1]!
				const getAttr = (name: string) => {
					const m = attrStr.match(new RegExp(`${name}=["']([^"']*)["']`, 'i'))
					return m ? m[1]!.trim() : ''
				}

				const title = getAttr('text') || getAttr('title')
				const xmlUrl = getAttr('xmlUrl')
				const htmlUrl = getAttr('htmlUrl') || xmlUrl

				if (htmlUrl && title) {
					importedEntries.push({
						id: `${htmlUrl}-${Math.random().toString(36).slice(2, 7)}`,
						author: title,
						title,
						link: htmlUrl,
						feed: xmlUrl || undefined,
						date: new Date().toISOString().slice(0, 10),
					})
				}
			}

			recordAuditLog('导入OPML', `${importedEntries.length} 条订阅`, `成功解析并导入 ${importedEntries.length} 个博友订阅源`)

			sendJson(res, 200, {
				code: 0,
				message: `成功解析 ${importedEntries.length} 条订阅`,
				data: { entries: importedEntries },
			})
			return
		}

		// 24.1 GET /api/feeds/my-feed - 获取本站友链展示信息 (myFeed)
		if (method === 'GET' && pathname === '/api/feeds/my-feed') {
			const blogMod = await import(`../blog.config.ts?t=${Date.now()}`)
			const blog = blogMod.default || {}
			const mf = blogMod.myFeed || {}

			sendJson(res, 200, {
				code: 0,
				data: {
					author: mf.author || blog.author?.name || 'kerntau',
					sitenick: mf.sitenick || '序栈',
					title: mf.title || blog.title || 'kerntau',
					desc: mf.desc || blog.subtitle || blog.description || '心中有景,花香满径',
					link: mf.link || blog.url || 'https://keru.in/',
					avatar: mf.avatar || blog.author?.avatar || '/avatar.webp',
					archs: mf.archs || ['React', 'Rsbuild'],
					date: mf.date || blog.timeEstablished || '2025-11-10',
					comment: mf.comment || '这是我自己',
				},
			})
			return
		}

		// 24.2 POST /api/feeds/my-feed/save - 保存本站友链展示信息 (myFeed)
		if (method === 'POST' && pathname === '/api/feeds/my-feed/save') {
			const body = await parseJsonBody<{
				author?: string
				sitenick?: string
				title?: string
				desc?: string
				link?: string
				avatar?: string
				archs?: string[]
				comment?: string
			}>(req)

			await updateBlogConfigFile((currentBlog, currentMyFeed) => {
				const updatedMyFeed = { ...currentMyFeed }
				if (body.sitenick !== undefined) updatedMyFeed.sitenick = body.sitenick
				if (body.comment !== undefined) updatedMyFeed.comment = body.comment
				if (body.archs && Array.isArray(body.archs)) updatedMyFeed.archs = body.archs

				const updatedBlog = { ...currentBlog }
				if (body.author !== undefined) {
					updatedBlog.author = { ...(updatedBlog.author || {}), name: body.author }
				}
				if (body.title !== undefined) updatedBlog.title = body.title
				if (body.desc !== undefined) updatedBlog.subtitle = body.desc
				if (body.link !== undefined) updatedBlog.url = body.link
				if (body.avatar !== undefined) {
					updatedBlog.author = { ...(updatedBlog.author || {}), avatar: body.avatar }
				}

				return { blogConfig: updatedBlog, myFeed: updatedMyFeed }
			})

			recordAuditLog('修改本站友链信息', 'blog.config.ts', '更新了友链页展示的本站信息 (myFeed)')
			triggerStaticBuild()

			sendJson(res, 200, { code: 0, message: '本站友链卡片展示信息已成功保存更新！' })
			return
		}

		// 24.3 GET /api/feeds/link-md - 读取友链申请说明 (link.md)
		if (method === 'GET' && pathname === '/api/feeds/link-md') {
			const linkMdPath = path.join(rootDir, 'content', 'link.md')
			const content = fs.existsSync(linkMdPath) ? fs.readFileSync(linkMdPath, 'utf-8') : ''
			sendJson(res, 200, { code: 0, data: { content } })
			return
		}

		// 24.4 POST /api/feeds/link-md/save - 保存友链申请说明 (link.md)
		if (method === 'POST' && pathname === '/api/feeds/link-md/save') {
			const body = await parseJsonBody<{ content: string }>(req)
			const linkMdPath = path.join(rootDir, 'content', 'link.md')
			safeWriteFileSync(linkMdPath, body.content || '')
			recordAuditLog('修改友链申请说明', 'content/link.md', '更新了友链页面的申请说明文档')
			triggerStaticBuild()
			sendJson(res, 200, { code: 0, message: '友链申请说明 (link.md) 已成功保存生效！' })
			return
		}

		// 25. GET /api/config - 获取配置
		if (method === 'GET' && pathname === '/api/config') {
			const blogConfigRaw = fs.existsSync(blogConfigPath) ? fs.readFileSync(blogConfigPath, 'utf-8') : ''
			const appConfigRaw = fs.existsSync(appConfigPath) ? fs.readFileSync(appConfigPath, 'utf-8') : ''
			sendJson(res, 200, {
				code: 0,
				data: {
					blogConfigRaw,
					appConfigRaw,
				},
			})
			return
		}

		// 26. POST /api/config/save - 保存配置
		if (method === 'POST' && pathname === '/api/config/save') {
			const body = await parseJsonBody<{ blogConfigRaw?: string, appConfigRaw?: string }>(req)
			if (body.blogConfigRaw !== undefined) {
				safeWriteFileSync(blogConfigPath, body.blogConfigRaw)
			}
			if (body.appConfigRaw !== undefined) {
				safeWriteFileSync(appConfigPath, body.appConfigRaw)
			}
			recordAuditLog('修改系统配置', 'blog.config.ts / app.config.ts', '更新了站点全局配置文件')
			triggerStaticBuild()
			sendJson(res, 200, { code: 0, message: '配置已更新保存' })
			return
		}

		// 27. GET /api/assets - 静态资源文件列表
		if (method === 'GET' && pathname === '/api/assets') {
			const assetFiles: Array<{ name: string, path: string, size: number, mtime: string }> = []
			function walkPublic(dir: string) {
				if (!fs.existsSync(dir)) return
				const items = fs.readdirSync(dir)
				for (const item of items) {
					if (item.startsWith('.')) continue
					const fullPath = path.join(dir, item)
					const stat = fs.statSync(fullPath)
					if (stat.isDirectory()) {
						walkPublic(fullPath)
					}
					else {
						const rel = path.relative(publicDir, fullPath).replace(/\\/g, '/')
						assetFiles.push({
							name: item,
							path: `/${rel}`,
							size: stat.size,
							mtime: stat.mtime.toISOString(),
						})
					}
				}
			}
			walkPublic(publicDir)
			sendJson(res, 200, { code: 0, data: assetFiles })
			return
		}

		// 28. POST /api/assets/references - 反向扫描博文引用
		if (method === 'POST' && pathname === '/api/assets/references') {
			const body = await parseJsonBody<{ assetPath: string }>(req)
			if (!body.assetPath) {
				sendJson(res, 400, { code: 400, message: '必须指定 assetPath' })
				return
			}

			const cleanAsset = body.assetPath.replace(/^\//, '')
			const baseName = path.basename(cleanAsset)
			const postFiles = walkDir(contentPostsDir)
			const referencedPosts: Array<{ title: string, path: string, relativePath: string }> = []

			for (const p of postFiles) {
				const content = fs.readFileSync(p, 'utf-8')
				if (content.includes(cleanAsset) || content.includes(baseName)) {
					const parsed = matter(content)
					referencedPosts.push({
						title: parsed.data.title || path.basename(p),
						path: p,
						relativePath: path.relative(contentPostsDir, p).replace(/\\/g, '/'),
					})
				}
			}

			sendJson(res, 200, {
				code: 0,
				data: {
					count: referencedPosts.length,
					posts: referencedPosts,
				},
			})
			return
		}

		// 29. POST /api/assets/upload - 上传静态资源
		if (method === 'POST' && pathname === '/api/assets/upload') {
			const body = await parseJsonBody<{ fileName: string, folder?: string, base64: string }>(req)
			if (!body.fileName || !body.base64) {
				sendJson(res, 400, { code: 400, message: '缺少文件名或内容' })
				return
			}
			const targetDir = body.folder ? path.join(publicDir, body.folder) : publicDir
			if (!fs.existsSync(targetDir)) {
				fs.mkdirSync(targetDir, { recursive: true })
			}
			const targetPath = path.join(targetDir, body.fileName)
			const base64Data = body.base64.replace(/^data:.*?;base64,/, '')
			fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'))
			const rel = path.relative(publicDir, targetPath).replace(/\\/g, '/')

			recordAuditLog('上传媒体资源', `/${rel}`, `上传了媒体文件 ${body.fileName}`)

			sendJson(res, 200, {
				code: 0,
				message: '上传成功',
				data: { path: `/${rel}` },
			})
			return
		}

		// 30. POST /api/assets/delete - 删除静态资源
		if (method === 'POST' && pathname === '/api/assets/delete') {
			const body = await parseJsonBody<{ path: string }>(req)
			if (!body.path) {
				sendJson(res, 400, { code: 400, message: '必须提供路径' })
				return
			}
			const targetPath = path.join(publicDir, body.path.replace(/^\//, ''))
			if (fs.existsSync(targetPath)) {
				fs.unlinkSync(targetPath)
				recordAuditLog('删除媒体资源', body.path, `删除了静态资源文件 ${body.path}`)
				sendJson(res, 200, { code: 0, message: '文件已删除' })
				return
			}
			sendJson(res, 404, { code: 404, message: '文件不存在' })
			return
		}

		// 31. GET /api/system/audit-logs - 审计操作日志
		if (method === 'GET' && pathname === '/api/system/audit-logs') {
			const logs = getAuditLogs()
			sendJson(res, 200, { code: 0, data: logs })
			return
		}

		// 32. GET /api/system/backup - 全量数据导出备份
		if (method === 'GET' && pathname === '/api/system/backup') {
			const posts = getAllPostsMeta()
			const postsContent: Record<string, string> = {}
			for (const p of posts) {
				postsContent[p.relativePath] = fs.readFileSync(p.path, 'utf-8')
			}
			const blogConfigRaw = fs.existsSync(blogConfigPath) ? fs.readFileSync(blogConfigPath, 'utf-8') : ''
			const appConfigRaw = fs.existsSync(appConfigPath) ? fs.readFileSync(appConfigPath, 'utf-8') : ''
			const feedsRaw = fs.existsSync(feedsFilePath) ? fs.readFileSync(feedsFilePath, 'utf-8') : ''

			const backupPayload = {
				version: '1.0',
				timestamp: Temporal.Now.plainDateTimeISO().toLocaleString('sv'),
				postCount: posts.length,
				blogConfigRaw,
				appConfigRaw,
				feedsRaw,
				posts: postsContent,
			}

			recordAuditLog('导出系统备份', 'Full Backup JSON', `生成了包含 ${posts.length} 篇文章与全部配置的系统备份`)

			sendJson(res, 200, {
				code: 0,
				data: backupPayload,
			})
			return
		}

		// 32.1 GET /api/system/backups - 获取历史快照列表
		if (method === 'GET' && pathname === '/api/system/backups') {
			const backupsDir = path.resolve(rootDir, '.backups')
			if (!fs.existsSync(backupsDir)) {
				fs.mkdirSync(backupsDir, { recursive: true })
			}
			const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.json'))
			const list = files.map((fileName) => {
				const filePath = path.join(backupsDir, fileName)
				const stat = fs.statSync(filePath)
				let note = ''
				let postCount = 0
				let timestamp = stat.mtime.toISOString()
				try {
					const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
					note = content.note || ''
					postCount = content.postCount || Object.keys(content.posts || {}).length || 0
					timestamp = content.timestamp || timestamp
				} catch {}
				return {
					fileName,
					size: stat.size,
					createdAt: timestamp,
					postCount,
					note,
				}
			}).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

			sendJson(res, 200, { code: 0, data: list })
			return
		}

		// 32.2 POST /api/system/backups/create - 一键创建本地快照
		if (method === 'POST' && pathname === '/api/system/backups/create') {
			const body = await parseJsonBody<{ note?: string }>(req)
			const backupsDir = path.resolve(rootDir, '.backups')
			if (!fs.existsSync(backupsDir)) {
				fs.mkdirSync(backupsDir, { recursive: true })
			}

			const posts = getAllPostsMeta()
			const postsContent: Record<string, string> = {}
			for (const p of posts) {
				postsContent[p.relativePath] = fs.readFileSync(p.path, 'utf-8')
			}
			const blogConfigRaw = fs.existsSync(blogConfigPath) ? fs.readFileSync(blogConfigPath, 'utf-8') : ''
			const appConfigRaw = fs.existsSync(appConfigPath) ? fs.readFileSync(appConfigPath, 'utf-8') : ''
			const feedsRaw = fs.existsSync(feedsFilePath) ? fs.readFileSync(feedsFilePath, 'utf-8') : ''

			const nowStr = Temporal.Now.plainDateTimeISO().toString({ smallestUnit: 'second' }).replace(/[:]/g, '-')
			const fileName = `snapshot-${nowStr}.json`
			const filePath = path.join(backupsDir, fileName)

			const backupPayload = {
				version: '1.0',
				timestamp: Temporal.Now.plainDateTimeISO().toLocaleString('sv'),
				note: body.note?.trim() || '手动全量快照',
				postCount: posts.length,
				blogConfigRaw,
				appConfigRaw,
				feedsRaw,
				posts: postsContent,
			}

			safeWriteFileSync(filePath, JSON.stringify(backupPayload, null, 2))
			recordAuditLog('创建本地快照', fileName, `生成了包含 ${posts.length} 篇文章的本地安全快照`)

			sendJson(res, 200, {
				code: 0,
				message: `快照已成功创建 (${fileName})`,
				data: { fileName },
			})
			return
		}

		// 32.3 POST /api/system/backups/restore-snapshot - 从指定快照还原
		if (method === 'POST' && pathname === '/api/system/backups/restore-snapshot') {
			const body = await parseJsonBody<{ fileName: string }>(req)
			const backupsDir = path.resolve(rootDir, '.backups')
			const filePath = path.join(backupsDir, body.fileName)
			if (!fs.existsSync(filePath)) {
				sendJson(res, 404, { code: 404, message: '快照文件不存在' })
				return
			}

			const backup = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
			if (backup.blogConfigRaw) safeWriteFileSync(blogConfigPath, backup.blogConfigRaw)
			if (backup.appConfigRaw) safeWriteFileSync(appConfigPath, backup.appConfigRaw)
			if (backup.feedsRaw) safeWriteFileSync(feedsFilePath, backup.feedsRaw)

			let restoredCount = 0
			if (backup.posts) {
				for (const [relPath, contentStr] of Object.entries(backup.posts as Record<string, string>)) {
					const full = path.join(contentPostsDir, relPath)
					safeWriteFileSync(full, contentStr)
					restoredCount++
				}
			}

			recordAuditLog('从快照还原系统', body.fileName, `成功恢复了 ${restoredCount} 篇文章与全站配置`)
			triggerStaticBuild()

			sendJson(res, 200, {
				code: 0,
				message: `已成功从快照 ${body.fileName} 还原数据 (${restoredCount} 篇文章)`,
			})
			return
		}

		// 32.4 DELETE /api/system/backups/delete - 删除指定快照
		if (method === 'POST' && pathname === '/api/system/backups/delete') {
			const body = await parseJsonBody<{ fileName: string }>(req)
			const backupsDir = path.resolve(rootDir, '.backups')
			const filePath = path.join(backupsDir, body.fileName)
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath)
				recordAuditLog('删除本地快照', body.fileName, '清除了旧历史快照')
			}
			sendJson(res, 200, { code: 0, message: '快照已删除' })
			return
		}

		// 33. POST /api/system/restore - 全量数据直接还原
		if (method === 'POST' && pathname === '/api/system/restore') {
			const body = await parseJsonBody<{ backup: any }>(req)
			const backup = body.backup
			if (!backup || !backup.posts) {
				sendJson(res, 400, { code: 400, message: '无效的备份数据结构' })
				return
			}

			if (backup.blogConfigRaw) safeWriteFileSync(blogConfigPath, backup.blogConfigRaw)
			if (backup.appConfigRaw) safeWriteFileSync(appConfigPath, backup.appConfigRaw)
			if (backup.feedsRaw) safeWriteFileSync(feedsFilePath, backup.feedsRaw)

			let restoredPostsCount = 0
			for (const [relPath, contentStr] of Object.entries(backup.posts as Record<string, string>)) {
				const full = path.join(contentPostsDir, relPath)
				safeWriteFileSync(full, contentStr)
				restoredPostsCount++
			}

			recordAuditLog('还原系统备份', `恢复了 ${restoredPostsCount} 篇文章`, `从上传的备份包执行了全量还原操作`)
			triggerStaticBuild()

			sendJson(res, 200, {
				code: 0,
				message: `系统数据已成功还原，恢复了 ${restoredPostsCount} 篇文章与全局配置`,
			})
			return
		}

		// 34. GET /api/system/integrity-check - 数据完整性体检
		if (method === 'GET' && pathname === '/api/system/integrity-check') {
			const posts = getAllPostsMeta()
			const issues: Array<{ type: 'error' | 'warning' | 'info', message: string, target: string }> = []

			const slugSet = new Set<string>()
			for (const p of posts) {
				if (slugSet.has(p.slug)) {
					issues.push({ type: 'error', message: `存在重复的文章 slug: ${p.slug}`, target: p.relativePath })
				}
				slugSet.add(p.slug)

				if (!p.title) {
					issues.push({ type: 'warning', message: '文章缺少标题 frontmatter', target: p.relativePath })
				}
				if (!p.date) {
					issues.push({ type: 'warning', message: '文章缺少发布日期 date', target: p.relativePath })
				}
				if (!p.categories || p.categories.length === 0) {
					issues.push({ type: 'info', message: '文章未显式声明分类，使用默认分类', target: p.relativePath })
				}
			}

			sendJson(res, 200, {
				code: 0,
				data: {
					totalPosts: posts.length,
					issueCount: issues.length,
					healthy: issues.filter(i => i.type === 'error').length === 0,
					issues,
				},
			})
			return
		}

		// 35. GET /api/system/git - Git 状态
		if (method === 'GET' && pathname === '/api/system/git') {
			exec('git status --porcelain', { cwd: rootDir }, (err, statusStdout) => {
				if (err) {
					sendJson(res, 200, { code: 0, data: { isGit: false, error: err.message } })
					return
				}
				exec('git log -n 5 --oneline', { cwd: rootDir }, (_err2, logStdout) => {
					const lines = statusStdout.trim().split('\n').filter(Boolean)
					const modifiedFiles = lines.map((l) => {
						return {
							status: l.slice(0, 2).trim(),
							file: l.slice(3).trim(),
						}
					})
					const logs = (logStdout || '').trim().split('\n').filter(Boolean)
					sendJson(res, 200, {
						code: 0,
						data: {
							isGit: true,
							hasChanges: modifiedFiles.length > 0,
							changes: modifiedFiles,
							recentCommits: logs,
						},
					})
				})
			})
			return
		}

		// 36. GET /api/system/build-stream - 静态数据构建 SSE 流
		if (method === 'GET' && pathname === '/api/system/build-stream') {
			res.writeHead(200, {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
				'Access-Control-Allow-Origin': '*',
			})

			res.write(`data: ${JSON.stringify({ type: 'start', message: '🚀 启动静态构建任务 (build-static)...' })}\n\n`)

			const child = spawn('npx', ['tsx', 'scripts/build-static.ts'], {
				cwd: rootDir,
				shell: true,
			})

			child.stdout.on('data', (data) => {
				const lines = data.toString().split('\n')
				for (const line of lines) {
					if (line.trim()) {
						res.write(`data: ${JSON.stringify({ type: 'stdout', message: line })}\n\n`)
					}
				}
			})

			child.stderr.on('data', (data) => {
				const lines = data.toString().split('\n')
				for (const line of lines) {
					if (line.trim()) {
						res.write(`data: ${JSON.stringify({ type: 'stderr', message: line })}\n\n`)
					}
				}
			})

			child.on('close', (code) => {
				if (code === 0) {
					recordAuditLog('静态数据构建', 'build-static', '成功触发全站静态索引与Atom XML构建刷新')
					res.write(`data: ${JSON.stringify({ type: 'done', message: '[SUCCESS] 构建完成，所有静态数据已刷新！', code: 0 })}\n\n`)
				}
				else {
					res.write(`data: ${JSON.stringify({ type: 'error', message: `[ERROR] 构建异常退出，状态码: ${code}`, code })}\n\n`)
				}
				res.end()
			})

			req.on('close', () => {
				child.kill()
			})
			return
		}

		// 404
		sendJson(res, 404, { code: 404, message: `Not Found: ${pathname}` })
	}
	catch (err: any) {
		console.error(`API 异常 [${pathname}]:`, err)
		sendJson(res, 500, { code: 500, message: err.message || '内部服务器错误' })
	}
})

server.listen(PORT, () => {
	console.log(`\n================================================`)
	console.log(`Blog Local Admin API Server 已就绪`)
	console.log(`运行端口: http://localhost:${PORT}`)
	console.log(`工作目录: ${rootDir}`)
	console.log(`================================================\n`)
})
