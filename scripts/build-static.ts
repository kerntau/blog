import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import { sumBy } from 'es-toolkit/math'
import { groupBy } from 'es-toolkit/array'
import GithubSlugger from 'github-slugger'
import XmlBuilder from 'fast-xml-builder'
import { compile } from '@mdx-js/mdx'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeShiki from '@shikijs/rehype'
import { transformerNotationDiff, transformerNotationHighlight } from '@shikijs/transformers'
import { visit } from 'unist-util-visit'
import blogConfig, { myFeed } from '../blog.config'
import feeds from '../src/feeds'
import packageJson from '../package.json'
import readingTimeOverrides from '../src/data/reading-time-overrides.json'
import { toZonedTemporal } from '../src/utils/time'
import remarkMusic from '../remark-plugins/remark-music'
import rehypeMetaSlots from '../remark-plugins/rehype-meta-slots'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const contentDir = join(rootDir, 'content')
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

const mdcLeafComponents: Record<string, string> = {
	'alert': 'Alert',
	'badge': 'Badge',
	'blog-header': 'BlogHeader',
	'copy': 'Copy',
	'emoji-clock': 'EmojiClock',
	'tip': 'Tip',
	'pic': 'Pic',
	'tab': 'Tab',
	'folding': 'Folding',
	'timeline': 'Timeline',
	'music-score': 'MusicScore',
	'video-embed': 'VideoEmbed',
	'poetry': 'Poetry',
	'link-card': 'LinkCard',
	'link-banner': 'LinkBanner',
	'chat': 'Chat',
	'key': 'Key',
	'quote': 'Quote',
	'card-list': 'CardList',
	'md-title': 'MdTitle',
}

function parseStyle(style?: string | Record<string, string>) {
	if (!style || typeof style !== 'string') {
		return style
	}
	return Object.fromEntries(style
		.split(';')
		.map(rule => rule.trim())
		.filter(Boolean)
		.map((rule) => {
			const [key, ...value] = rule.split(':')
			return [
				key!.trim().replace(/-([a-z])/g, (_, char: string) => char.toUpperCase()),
				value.join(':').trim(),
			]
		}))
}

function preprocessMdc(source: string) {
	let inCodeBlock = false
	let inTemplateProp = false
	const blockStack: string[] = []

	return source
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<br\s*>/gi, '<br />')
		.replace(/<hr\s*>/gi, '<hr />')
		.replace(/<img\s+([^>]*?[^\/])>/gi, '<img $1 />')
		.split('\n')
		.map((line) => {
			if (/^\s*```/.test(line)) {
				inCodeBlock = !inCodeBlock
				return line
			}
			if (inCodeBlock) {
				return line
			}
			if (line.includes('={`')) {
				inTemplateProp = true
			}
			if (inTemplateProp) {
				if (line.includes('`}')) {
					inTemplateProp = false
				}
				return line
			}

			const processedLine = line
				.replace(/(`[^`\n]*`|\[[^\]\n]*\]\([^)\n]*\)|\[[^\]\n]*\])\{[^}\n]*\}/g, '$1')
				.replace(/\s:([A-Za-z_$][\w$-]*)=(['"])(.*?)\2/g, (_full, prop: string, _quote: string, value: string) => ` ${prop}={${value}}`)
				.replace(/\sstyle=(['"])(.*?)\1/g, (_full, _quote: string, value: string) => {
					const styleObject = parseStyle(value) as Record<string, string>
					return ` style={${JSON.stringify(styleObject)}}`
				})

			// Handle ::block end
			if (/^\s*::\s*$/.test(processedLine) && blockStack.length > 0) {
				const component = blockStack.pop()
				return `</${component}>`
			}

			// Handle ::block start
			const blockMatch = processedLine.match(/^\s*::([a-z][\w-]*)(\{[^}\n]*\})?/i)
			if (blockMatch) {
				const name = blockMatch[1]!
				const component = mdcLeafComponents[name] || name.charAt(0).toUpperCase() + name.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
				const props = blockMatch[2] ? blockMatch[2].slice(1, -1).trim() : ''
				blockStack.push(component)
				return `<${component}${props ? ` ${props}` : ''}>`
			}

			// Handle :inline and :leaf
			const expandedDirectives = processedLine.replace(/(^|[^\w/]):([a-z][\w-]*)(\{[^}\n]*\})?/g, (full, prefix: string, name: string, attrs = '') => {
				const component = mdcLeafComponents[name]
				if (!component) {
					return full
				}
				const props = attrs ? attrs.slice(1, -1).trim() : ''
				return `${prefix}<${component}${props ? ` ${props}` : ''} />`
			})

			if (/<\/?[A-Z]/.test(expandedDirectives)) {
				return expandedDirectives
			}

			return expandedDirectives
				.split(/(`[^`\n]*`)/g)
				.map((part, index) => index % 2 === 1 ? part : part.replace(/[{}]/g, brace => `\\${brace}`))
				.join('')
		})
		.join('\n')
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

async function compileMdxSource(rawBody: string) {
	const source = preprocessMdc(rawBody)
	const slugger = new GithubSlugger()
	const toc: any[] = []

	try {
		const compiled = await compile(source, {
			outputFormat: 'function-body',
			development: false,
			remarkPlugins: [
				remarkMath,
				remarkMusic,
				() => (tree: any) => {
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
				[rehypeShiki as any, {
					themes: {
						light: 'github-light',
						dark: 'github-dark',
					},
					transformers: [
						transformerNotationDiff(),
						transformerNotationHighlight(),
					],
				}],
			],
		})

		return {
			compiledCode: String(compiled.value),
			toc,
		}
	} catch (err) {
		console.warn('MDX 编译异常，使用源码回退:', err)
		return {
			compiledCode: '',
			toc: [],
		}
	}
}

async function getAllPostsData() {
	const posts: any[] = []

	async function traverse(dir: string) {
		const files = readdirSync(dir)
		for (const file of files) {
			const fullPath = join(dir, file)
			if (statSync(fullPath).isDirectory()) {
				await traverse(fullPath)
			} else if (fullPath.endsWith('.mdx')) {
				const content = readFileSync(fullPath, 'utf-8')
				const { data: rawData, content: body } = matter(content)
				const data = normalizeArticleData(rawData, content)

				let relativePath = fullPath.replace(contentDir, '').replace(/\\/g, '/').replace(/\.mdx$/, '')
				if (!relativePath.startsWith('/')) {
					relativePath = '/' + relativePath
				}
				const stem = relativePath.replace(/^\//, '')

				if (data.permalink) {
					relativePath = data.permalink.startsWith('/') ? data.permalink : `/${data.permalink}`
				} else if (blogConfig.article.hidePostPrefix && relativePath.startsWith('/posts/')) {
					relativePath = relativePath.slice('/posts'.length)
				}

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

				const { compiledCode, toc } = await compileMdxSource(body)

				posts.push({
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
				})
			}
		}
	}

	await traverse(contentDir)
	return posts.sort((a, b) => {
		const dateA = String(a.date || a.published || '')
		const dateB = String(b.date || b.published || '')
		return dateB.localeCompare(dateA)
	})
}

function calculateStats(posts: any[]) {
	const blogPosts = posts.filter(p => p._stem.startsWith('posts/'))
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

function generateSearchIndex(posts: any[]) {
	const slugger = new GithubSlugger()
	const index: any[] = []

	posts.forEach((p) => {
		try {
			const { body: content } = p
			slugger.reset()
			const postTitle = p.title || ''
			const articlePath = p.path.replace(/^\//, '').replace(/\//g, ' > ')

			const cleanContent = content
				.replace(/!\[.*?\]\(.*?\)/g, '')
				.replace(/\[(.*?)\]\(.*?\)/g, '$1')

			const lines = cleanContent.split('\n')
			let currentSection = {
				id: p.path,
				title: postTitle,
				titles: [articlePath],
				content: '',
				level: 1,
			}

			const hierarchy: { title: string, level: number }[] = [{ title: postTitle, level: 1 }]

			lines.forEach((line: string) => {
				const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
				if (headingMatch) {
					if (currentSection.content.trim() || currentSection.level === 1) {
						index.push({ ...currentSection, content: currentSection.content.trim().slice(0, 800) })
					}

					const level = headingMatch[1]!.length
					const title = headingMatch[2]!.trim()
					const slug = slugger.slug(title)

					while (hierarchy.length > 0 && hierarchy[hierarchy.length - 1]!.level >= level) {
						hierarchy.pop()
					}

					const parentTitles = hierarchy.map(h => h.title)
					hierarchy.push({ title, level })

					currentSection = {
						id: `${p.path}#${slug}`,
						title: title,
						titles: [articlePath, ...parentTitles],
						content: '',
						level: level,
					}
				} else {
					currentSection.content += line + '\n'
				}
			})

			if (currentSection.content.trim() || currentSection.level === 1) {
				index.push({ ...currentSection, content: currentSection.content.trim().slice(0, 800) })
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
			$uri: 'https://blog.cot.wiki',
			$version: packageJson.version,
			_: 'Cotovo Blog Engine (Rsbuild)',
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

export async function buildStaticData() {
	console.log('📦 正在提取文章数据并进行 MDX 预编译与静态文件生成...')
	const posts = await getAllPostsData()
	const stats = calculateStats(posts)
	const searchIndex = generateSearchIndex(posts)
	const atomXml = generateAtomXml(posts)
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

	writeFileSync(join(publicDir, 'atom.xml'), atomXml, 'utf-8')
	writeFileSync(join(publicDir, 'cotovo.opml'), opmlXml, 'utf-8')
	writeFileSync(join(publicApiDir, 'stats.json'), JSON.stringify(stats, null, 2), 'utf-8')
	writeFileSync(join(publicApiDir, 'search.json'), JSON.stringify(searchIndex, null, 2), 'utf-8')

	console.log(`✅ 静态数据生成完毕：共预编译 ${posts.length} 篇文章，已生成 atom.xml, cotovo.opml, stats.json, search.json`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	buildStaticData().catch((err) => {
		console.error('生成静态数据失败:', err)
		process.exit(1)
	})
}
