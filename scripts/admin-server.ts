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

import { calculatePostStats, normalizeFrontmatter } from '../src/utils/post-meta'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const contentPostsDir = path.join(rootDir, 'content', 'posts')
const feedsFilePath = path.join(rootDir, 'src', 'feeds.ts')
const blogConfigPath = path.join(rootDir, 'blog.config.ts')
const appConfigPath = path.join(rootDir, 'src', 'app.config.ts')
const publicDir = path.join(rootDir, 'public')

const PORT = Number(process.env.ADMIN_PORT) || 3001
const startTime = Date.now()

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
	const tmpPath = `${filePath}.${Date.now()}.tmp`
	fs.writeFileSync(tmpPath, content, 'utf-8')
	fs.renameSync(tmpPath, filePath)
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

	// 按照 date 倒序排序
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

		// 猜测架构 / Generator
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

			for (const p of posts) {
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

		// 3. GET /api/posts/detail - 获取文章详情（带 Markdown 原文）
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

		// 4. POST /api/posts/save - 保存与更新文章
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

			const fileContent = matter.stringify(body.content || '', fm)
			safeWriteFileSync(targetPath, fileContent)

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
			sendJson(res, 200, { code: 0, message: '文章已安全删除' })
			return
		}

		// 7. POST /api/posts/validate - 单篇 MDX 语法静态校验
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

		// 8. POST /api/posts/batch - 批量文章操作（批量分类/草稿/删除）
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

			sendJson(res, 200, {
				code: 0,
				message: `批量操作完成，共处理 ${modifiedCount} 篇文章`,
				data: { modifiedCount },
			})
			return
		}

		// 9. POST /api/posts/open-vscode - 调用 VS Code 打开
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

		// 10. GET /api/feeds - 获取友链列表
		if (method === 'GET' && pathname === '/api/feeds') {
			const feeds = await getFeedsData()
			sendJson(res, 200, { code: 0, data: feeds })
			return
		}

		// 11. POST /api/feeds/save - 保存友链文件
		if (method === 'POST' && pathname === '/api/feeds/save') {
			const body = await parseJsonBody<{ groups: FeedGroupData[] }>(req)
			if (!Array.isArray(body.groups)) {
				sendJson(res, 400, { code: 400, message: 'groups 必须是数组' })
				return
			}
			serializeFeedsToFile(body.groups)
			sendJson(res, 200, { code: 0, message: '友链数据已保存' })
			return
		}

		// 12. POST /api/feeds/sniff - 智能嗅探站点元数据
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

		// 13. POST /api/feeds/check - 友链连通性检测
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

		// 14. POST /api/feeds/import-opml - 导入 OPML 友链
		if (method === 'POST' && pathname === '/api/feeds/import-opml') {
			const body = await parseJsonBody<{ opmlContent: string, targetGroupName?: string }>(req)
			if (!body.opmlContent) {
				sendJson(res, 400, { code: 400, message: 'OPML 内容不能为空' })
				return
			}

			// 解析 OPML outline 节点
			const outlineRegex = /<outline\s+([^>]+)>/gi
			const importedEntries: FeedItem[] = []
			const matches = Array.from(body.opmlContent.matchAll(outlineRegex))

			for (const match of matches) {
				const attrStr = match[1]
				const getAttr = (name: string) => {
					const m = attrStr.match(new RegExp(`${name}=["']([^"']*)["']`, 'i'))
					return m ? m[1].trim() : ''
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

			sendJson(res, 200, {
				code: 0,
				message: `成功解析 ${importedEntries.length} 条订阅`,
				data: { entries: importedEntries },
			})
			return
		}

		// 15. GET /api/config - 获取站点与应用配置
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

		// 16. POST /api/config/save - 保存配置文件
		if (method === 'POST' && pathname === '/api/config/save') {
			const body = await parseJsonBody<{ blogConfigRaw?: string, appConfigRaw?: string }>(req)
			if (body.blogConfigRaw !== undefined) {
				safeWriteFileSync(blogConfigPath, body.blogConfigRaw)
			}
			if (body.appConfigRaw !== undefined) {
				safeWriteFileSync(appConfigPath, body.appConfigRaw)
			}
			sendJson(res, 200, { code: 0, message: '配置已更新保存' })
			return
		}

		// 17. GET /api/assets - 静态资源文件列表
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

		// 18. POST /api/assets/references - 反向扫描博文引用
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

		// 19. POST /api/assets/upload - 上传静态资源 (Base64)
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
			sendJson(res, 200, {
				code: 0,
				message: '上传成功',
				data: { path: `/${rel}` },
			})
			return
		}

		// 20. POST /api/assets/delete - 删除静态资源
		if (method === 'POST' && pathname === '/api/assets/delete') {
			const body = await parseJsonBody<{ path: string }>(req)
			if (!body.path) {
				sendJson(res, 400, { code: 400, message: '必须提供路径' })
				return
			}
			const targetPath = path.join(publicDir, body.path.replace(/^\//, ''))
			if (fs.existsSync(targetPath)) {
				fs.unlinkSync(targetPath)
				sendJson(res, 200, { code: 0, message: '文件已删除' })
				return
			}
			sendJson(res, 404, { code: 404, message: '文件不存在' })
			return
		}

		// 21. GET /api/system/git - Git 状态
		if (method === 'GET' && pathname === '/api/system/git') {
			exec('git status --porcelain', { cwd: rootDir }, (err, statusStdout) => {
				if (err) {
					sendJson(res, 200, { code: 0, data: { isGit: false, error: err.message } })
					return
				}
				exec('git log -n 5 --oneline', { cwd: rootDir }, (_err2, logStdout) => {
					const lines = statusStdout.trim().split('\n').filter(Boolean)
					const modifiedFiles = lines.map((l) => {
						const status = l.slice(0, 2).trim()
						const file = l.slice(3).trim()
						return { status, file }
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

		// 22. GET /api/system/build-stream - 静态数据构建 SSE 流
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
