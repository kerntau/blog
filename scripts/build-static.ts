import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import os from 'node:os'
import pLimit from 'p-limit'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import { sumBy } from 'es-toolkit/math'
import { groupBy } from 'es-toolkit/array'
import GithubSlugger from 'github-slugger'
import XmlBuilder from 'fast-xml-builder'
import { compile } from '@mdx-js/mdx'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeShikiFromHighlighter from '@shikijs/rehype/core'
import { createHighlighter, type Highlighter } from 'shiki'
import {
	transformerNotationDiff,
	transformerNotationHighlight,
	transformerNotationWordHighlight,
	transformerNotationFocus,
	transformerNotationErrorLevel,
} from '@shikijs/transformers'
import { visit } from 'unist-util-visit'
import blogConfig, { myFeed } from '../blog.config'
import feeds from '../src/feeds'
import packageJson from '../package.json'
import { toZonedTemporal } from '../src/utils/time'
import { parseArrayField } from '../src/utils/post-meta'
import { preprocessMdc } from '../src/utils/mdc'
import remarkMusic from '../remark-plugins/remark-music'
import rehypeMetaSlots from '../remark-plugins/rehype-meta-slots'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const contentDir = join(rootDir, 'content')
const cacheDir = join(rootDir, 'node_modules', '.cache', 'blog-mdx')
const CACHE_VERSION = 'v2'
const dateFields = ['date', 'updated', 'published'] as const

function rehypeHeadingAnchors() {
	return (tree: any) => {
		visit(tree, 'element', (node: any) => {
			if (!/^h[1-6]$/.test(node.tagName)) return
			const id = node.properties?.id
			if (!id) return
			if (node.children?.[0]?.type === 'element' && node.children[0].tagName === 'a') return

			node.children = [{
				type: 'element',
				tagName: 'a',
				properties: { href: `#${id}` },
				children: node.children || [],
			}]
		})
	}
}

function extractRawFrontmatterValue(source: string, field: string) {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
	if (!match) return undefined
	const yaml = match[1]!
	const fieldMatch = yaml.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))
	if (!fieldMatch) return undefined
	return fieldMatch[1]!.trim().replace(/^['"]|['"]$/g, '')
}

function normalizeArticleData(data: Record<string, any>, source = '') {
	const normalized = { ...data }
	for (const field of dateFields) {
		const rawValue = extractRawFrontmatterValue(source, field)
		if (rawValue) {
			normalized[field] = rawValue
			continue
		}
		if (normalized[field] instanceof Date) {
			normalized[field] = normalized[field].toISOString()
		}
	}
	if (normalized.aside) {
		normalized.meta = {
			...normalized.meta,
			aside: normalized.aside,
		}
	}
	return normalized
}

let sharedHighlighterPromise: Promise<Highlighter> | null = null
function getSharedHighlighter() {
	if (!sharedHighlighterPromise) {
		sharedHighlighterPromise = createHighlighter({
			themes: ['catppuccin-latte', 'one-dark-pro'],
			langs: [
				'javascript',
				'typescript',
				'jsx',
				'tsx',
				'json',
				'yaml',
				'markdown',
				'mdx',
				'html',
				'css',
				'scss',
				'bash',
				'shell',
				'python',
				'go',
				'rust',
				'c',
				'cpp',
				'java',
				'sql',
				'toml',
				'diff',
			],
		})
	}
	return sharedHighlighterPromise
}

async function compileMdxSource(rawSource: string, frontmatterTitle?: string, filePath = '') {
	const source = preprocessMdc(rawSource)
	const cacheKey = createHash('md5').update(`${CACHE_VERSION}:${source}`).digest('hex')
	const cacheFile = join(cacheDir, `${cacheKey}.json`)

	if (existsSync(cacheFile)) {
		try {
			return JSON.parse(readFileSync(cacheFile, 'utf-8'))
		} catch {
			// 忽略缓存解析失败
		}
	}

	const slugger = new GithubSlugger()
	const toc: any[] = []
	let isFirstHeading = true

	try {
		const highlighter = await getSharedHighlighter()
		const compiled = await compile(source, {
			outputFormat: 'function-body',
			development: false,
			remarkPlugins: [
				remarkMath,
				remarkMusic,
				() => (tree: any) => {
					// 过滤与 frontmatter title 重复的第一个一级大标题，防止正文重复渲染
					tree.children = tree.children.filter((node: any) => {
						if (node.type === 'heading' && isFirstHeading) {
							isFirstHeading = false
							if (node.depth === 1) {
								const text = (node.children || []).map((c: any) => c.value || '').join('').trim()
								if (!frontmatterTitle || text === frontmatterTitle.trim()) {
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
						node.data = node.data || {}
						node.data.hProperties = node.data.hProperties || {}
						node.data.hProperties.id = id
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
				rehypeMetaSlots,
				rehypeHeadingAnchors,
				[rehypeShikiFromHighlighter as any, highlighter, {
					themes: {
						light: 'catppuccin-latte',
						dark: 'one-dark-pro',
					},
					transformers: [
						transformerNotationDiff(),
						transformerNotationHighlight(),
						transformerNotationWordHighlight(),
						transformerNotationFocus(),
						transformerNotationErrorLevel(),
						{
							name: 'transformer-meta-and-lines',
							line(node: any, line: number) {
								node.properties = node.properties || {}
								node.properties['data-line'] = String(line)
							},
							pre(node: any) {
								const rawMeta = (this as any).options?.meta?.__raw || ''
								node.properties = node.properties || {}
								if (rawMeta) {
									node.properties['data-meta'] = rawMeta
									const filenameMatch = rawMeta.match(/\[(.*?)\]/) || rawMeta.match(/(?:filename|title)=["'](.*?)["']/)
									if (filenameMatch) {
										node.properties['data-filename'] = filenameMatch[1]
									}
								}
								if ((this as any).options?.lang) {
									node.properties['data-language'] = (this as any).options.lang
								}
								if (node.children?.[0]?.children) {
									node.children[0].children = node.children[0].children.filter(
										(c: any) => c.type !== 'text' || c.value.trim() !== '',
									)
								}
							},
						},
					],
				}],
			],
		})

		const result = {
			compiledCode: String(compiled.value),
			toc,
		}

		try {
			mkdirSync(cacheDir, { recursive: true })
			writeFileSync(cacheFile, JSON.stringify(result), 'utf-8')
		} catch {
			// 忽略缓存写入失败
		}

		return result
	} catch (err) {
		console.warn(`MDX 编译异常 [${filePath}]:`, err)
		return {
			compiledCode: '',
			toc: [],
		}
	}
}

function getPostFiles(dir: string): string[] {
	const results: string[] = []
	const files = readdirSync(dir)
	for (const file of files) {
		const fullPath = join(dir, file)
		if (statSync(fullPath).isDirectory()) {
			results.push(...getPostFiles(fullPath))
		} else if (fullPath.endsWith('.mdx') || fullPath.endsWith('.md')) {
			results.push(fullPath)
		}
	}
	return results
}

async function getAllPostsData() {
	const files = getPostFiles(contentDir)
	const limit = pLimit(Math.max(os.cpus().length, 4))
	const overridesPath = join(rootDir, 'src/data/reading-time-overrides.json')
	const readingTimeOverrides: Record<string, number> = existsSync(overridesPath)
		? JSON.parse(readFileSync(overridesPath, 'utf-8'))
		: {}

	const posts = await Promise.all(
		files.map(fullPath => limit(async () => {
			const content = readFileSync(fullPath, 'utf-8')
			const { data: rawData, content: body } = matter(content)
			const data = normalizeArticleData(rawData, content)

			let relativePath = fullPath
				.replace(contentDir, '')
				.replace(/\\/g, '/')
				.replace(/\.(mdx|md)$/, '')
			if (!relativePath.startsWith('/')) {
				relativePath = '/' + relativePath
			}
			const stem = relativePath.replace(/^\//, '')

			if (data.permalink) {
				relativePath = data.permalink.startsWith('/') ? data.permalink : `/${data.permalink}`
			} else if (data.url) {
				relativePath = data.url.startsWith('/') ? data.url : `/${data.url}`
			} else if (blogConfig.article.hidePostPrefix && relativePath.startsWith('/posts/')) {
				relativePath = relativePath.slice('/posts'.length)
			}

			if (!data.description && data.summary) {
				data.description = data.summary
			}

			if (!data.image && Array.isArray(data.images) && data.images.length > 0) {
				data.image = data.images[0]
			}

			const parsedCats = parseArrayField(data.categories || data.category)
			data.categories = parsedCats.length > 0 ? parsedCats : [blogConfig.defaultCategory]
			data.tags = parseArrayField(data.tags)

			if (!data.readingTime) {
				data.readingTime = readingTime(body)
			}
			const words = (readingTimeOverrides as Record<string, number>)[relativePath]
			if (typeof words === 'number') {
				data.readingTime = {
					...data.readingTime,
					words,
				}
			}

			const { compiledCode, toc } = await compileMdxSource(body, data.title, fullPath)

			return {
				categories: [blogConfig.defaultCategory],
				tags: [],
				type: Object.keys(blogConfig.article.types)[0],
				draft: false,
				...data,
				path: relativePath,
				_stem: stem,
				_filePath: fullPath.replace(rootDir, '').replace(/\\/g, '/').replace(/^\//, ''),
				toc,
				compiledCode,
				body,
			}
		})),
	)

	return posts.sort((a: any, b: any) => {
		const dateA = String(a.date || a.published || '')
		const dateB = String(b.date || b.published || '')
		return dateB.localeCompare(dateA)
	})
}

function calculateStats(posts: any[]) {
	const blogPosts = posts.filter(p => !p.draft && p._stem !== 'link' && p._stem !== 'theme' && !p._stem.startsWith('previews/'))
	const totalWords = sumBy(blogPosts, p => p.readingTime?.words ?? 0)

	const annual: Record<string, { posts: number, words: number }> = {}
	const grouped = groupBy(blogPosts, p => {
		try {
			const d = p.date || ''
			return toZonedTemporal(d).year.toString()
		} catch {
			return 'Unknown'
		}
	})

	for (const [year, items] of Object.entries(grouped)) {
		annual[year] = {
			posts: items.length,
			words: sumBy(items, p => p.readingTime?.words ?? 0),
		}
	}

	return {
		total: {
			posts: blogPosts.length,
			words: totalWords,
		},
		annual,
	}
}

function stripMarkdown(text: string) {
	return text
		.replace(/```[\s\S]*?```/g, '')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/!\[(.*?)\]\(.*?\)/g, '$1')
		.replace(/\[(.*?)\]\(.*?\)/g, '$1')
		.replace(/(\*\*|__)(.*?)\1/g, '$2')
		.replace(/(\*|_)(.*?)\1/g, '$2')
		.replace(/~~(.*?)~~/g, '$1')
		.replace(/^:::.*$/gm, '')
		.replace(/^::.*$/gm, '')
		.replace(/<[^>]+>/g, '')
		.replace(/^>\s+/gm, '')
		.replace(/^#{1,6}\s+/gm, '')
		.replace(/\s+/g, ' ')
		.trim()
}

function generateSearchIndex(posts: any[]) {
	const slugger = new GithubSlugger()
	const index: any[] = []

	posts.forEach((p) => {
		try {
			if (p.draft) return
			const { body: content } = p
			slugger.reset()
			const postTitle = p.title || ''

			const lines = content.split('\n')
			let currentSection = {
				id: p.path,
				title: postTitle,
				titles: [] as string[],
				content: '',
				level: 1,
			}

			const hierarchy: { title: string, level: number }[] = [{ title: postTitle, level: 1 }]

			lines.forEach((line: string) => {
				const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
				if (headingMatch) {
					const cleanText = stripMarkdown(currentSection.content)
					if (cleanText || currentSection.level === 1) {
						index.push({ ...currentSection, content: cleanText.slice(0, 800) })
					}

					const level = headingMatch[1]!.length
					const rawTitle = headingMatch[2]!.trim()
					const title = stripMarkdown(rawTitle)
					const slug = slugger.slug(title || rawTitle)

					while (hierarchy.length > 0 && hierarchy[hierarchy.length - 1]!.level >= level) {
						hierarchy.pop()
					}

					const parentTitles = hierarchy.map(h => h.title)
					hierarchy.push({ title, level })

					currentSection = {
						id: `${p.path}#${slug}`,
						title: title,
						titles: [...parentTitles],
						content: '',
						level: level,
					}
				} else {
					currentSection.content += line + '\n'
				}
			})

			const cleanText = stripMarkdown(currentSection.content)
			if (cleanText || currentSection.level === 1) {
				index.push({ ...currentSection, content: cleanText.slice(0, 800) })
			}
		} catch (e) {
			console.error(`Failed to index post ${p.path}:`, e)
		}
	})

	return index
}

function generateAtomXml(posts: any[]) {
	const builder = new XmlBuilder({
		attributeNamePrefix: '$',
		cdataPropName: '$',
		format: true,
		ignoreAttributes: false,
		textNodeName: '_',
	})

	function getUrl(path?: string) {
		return new URL(path ?? '', blogConfig.url).toString()
	}

	function formatIsoDate(date?: string) {
		if (!date) return ''
		try {
			return toZonedTemporal(date).toInstant().toString()
		} catch {
			return date
		}
	}

	const feedPosts = posts.filter(p => p._stem.startsWith('posts/')).slice(0, blogConfig.feed.limit)

	const entries = feedPosts.map(post => ({
		id: getUrl(post.path),
		title: post.title ?? '',
		updated: formatIsoDate(post.updated || post.date),
		author: { name: blogConfig.author.name },
		content: {
			$type: 'html',
			$: `<div>${post.title}</div><a href="${getUrl(post.path)}">阅读全文</a>`,
		},
		link: { $href: getUrl(post.path) },
		summary: post.title,
		category: { $term: post.categories?.[0] },
		published: formatIsoDate(post.date),
	}))

	const feed = {
		$xmlns: 'http://www.w3.org/2005/Atom',
		id: blogConfig.url,
		title: blogConfig.title,
		updated: new Date().toISOString(),
		description: blogConfig.description,
		author: {
			name: blogConfig.author.name,
			email: blogConfig.author.email,
			uri: blogConfig.author.homepage,
		},
		link: [
			{ $href: getUrl('atom.xml'), $rel: 'self' },
			{ $href: blogConfig.url, $rel: 'alternate' },
		],
		generator: {
			$uri: blogConfig.url,
			$version: packageJson.version,
			_: 'Blog Engine (Rsbuild)',
		},
		icon: blogConfig.favicon,
		logo: blogConfig.author.avatar,
		rights: `© ${new Date().getFullYear()} ${blogConfig.author.name}`,
		subtitle: blogConfig.subtitle || blogConfig.description,
		entry: entries,
	}

	return builder.build({
		'?xml': { $version: '1.0', $encoding: 'UTF-8' },
		feed,
	})
}

function generateOpml() {
	const builder = new XmlBuilder({
		attributeNamePrefix: '$',
		format: true,
		ignoreAttributes: false,
	})

	function mapEntry(item: any) {
		return {
			$text: item.title || item.sitenick || item.author,
			$type: 'rss',
			$xmlUrl: item.feed,
			$created: item.date ? toZonedTemporal(item.date).toInstant().toString() : undefined,
			$description: item.desc,
			$htmlUrl: item.link || item.feed,
		}
	}

	const outlines = [
		mapEntry(myFeed),
		...feeds.flatMap(({ entries }: any) => entries.filter((e: any) => e.feed).map(mapEntry)),
	]

	const opml = {
		$version: '2.0',
		head: {
			title: `${blogConfig.title}的友链订阅`,
			dateCreated: toZonedTemporal(blogConfig.timeEstablished).toInstant().toString(),
			dateModified: new Date().toISOString(),
			ownerName: blogConfig.author.name,
			ownerEmail: blogConfig.author.email,
			ownerId: blogConfig.author.homepage,
			docs: 'https://opml.org/spec2.opml',
		},
		body: { outline: outlines },
	}

	return builder.build({
		'?xml': { $version: '1.0', $encoding: 'UTF-8' },
		opml,
	})
}

function generateSitemapXml(posts: any[]) {
	const builder = new XmlBuilder({
		attributeNamePrefix: '$',
		format: true,
		ignoreAttributes: false,
		textNodeName: '_',
	})

	const baseUrl = blogConfig.url.replace(/\/$/, '')

	const urlList: any[] = [
		{
			loc: `${baseUrl}/`,
			lastmod: new Date().toISOString().slice(0, 10),
			changefreq: 'daily',
			priority: '1.0',
		},
		{
			loc: `${baseUrl}/categories`,
			lastmod: new Date().toISOString().slice(0, 10),
			changefreq: 'weekly',
			priority: '0.7',
		},
		{
			loc: `${baseUrl}/archive`,
			lastmod: new Date().toISOString().slice(0, 10),
			changefreq: 'daily',
			priority: '0.7',
		},
		{
			loc: `${baseUrl}/link`,
			lastmod: new Date().toISOString().slice(0, 10),
			changefreq: 'monthly',
			priority: '0.5',
		},
	]

	// 注入所有公开发布的文章
	const publicPosts = posts.filter(p => !p.draft && p._stem?.startsWith('posts/'))
	for (const p of publicPosts) {
		const postUrl = `${baseUrl}${p.path.startsWith('/') ? p.path : `/${p.path}`}`
		const lastModDate = p.updated || p.date || new Date().toISOString().slice(0, 10)
		urlList.push({
			loc: postUrl,
			lastmod: String(lastModDate).slice(0, 10),
			changefreq: 'weekly',
			priority: '0.8',
		})
	}

	const urlset = {
		$xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
		url: urlList,
	}

	return builder.build({
		'?xml': { $version: '1.0', $encoding: 'UTF-8' },
		urlset,
	})
}

function generateRobotsTxt() {
	const baseUrl = blogConfig.url.replace(/\/$/, '')
	return `# Robots.txt for ${blogConfig.title}
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin

Sitemap: ${baseUrl}/sitemap.xml
`
}

export async function buildStaticData() {
	console.log('📦 正在提取文章数据并进行 MDX 预编译与静态文件生成...')
	const posts = await getAllPostsData()
	const stats = calculateStats(posts)
	const searchIndex = generateSearchIndex(posts)
	const atomXml = generateAtomXml(posts)
	const sitemapXml = generateSitemapXml(posts)
	const robotsTxt = generateRobotsTxt()
	const opmlXml = generateOpml()

	// 1. 生成 src/data/generated-posts.json
	const dataDir = join(rootDir, 'src', 'data')
	mkdirSync(dataDir, { recursive: true })
	writeFileSync(
		join(dataDir, 'generated-posts.json'),
		JSON.stringify({ posts, stats }, null, 2),
		'utf-8',
	)

	// 2. 生成 public 静态资源
	const publicDir = join(rootDir, 'public')
	const publicApiDir = join(publicDir, 'api')
	mkdirSync(publicApiDir, { recursive: true })

	writeFileSync(join(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8')
	writeFileSync(join(publicDir, 'robots.txt'), robotsTxt, 'utf-8')
	writeFileSync(join(publicDir, 'atom.xml'), atomXml, 'utf-8')
	writeFileSync(join(publicDir, 'friends.opml'), opmlXml, 'utf-8')
	writeFileSync(join(publicDir, 'cotovo.opml'), opmlXml, 'utf-8')
	writeFileSync(join(publicApiDir, 'stats.json'), JSON.stringify(stats, null, 2), 'utf-8')
	writeFileSync(join(publicApiDir, 'search.json'), JSON.stringify(searchIndex, null, 2), 'utf-8')

	console.log(`静态数据生成完毕：共预编译 ${posts.length} 篇文章，已生成 sitemap.xml, robots.txt, atom.xml, friends.opml, stats.json, search.json`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	buildStaticData().catch((err) => {
		console.error('生成静态数据失败:', err)
		process.exit(1)
	})
}
