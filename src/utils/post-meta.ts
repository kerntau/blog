/**
 * 统一博文元数据解析与 Markdown 清洗纯函数 (Single Source of Truth)
 * 供 build-static.ts, admin-server.ts 与前端共享使用
 */

export interface NormalizedFrontmatter {
	title: string
	description?: string
	date?: string
	updated?: string
	published?: string
	categories: string[]
	tags: string[]
	type: string
	image?: string
	permalink?: string
	draft: boolean
	recommend?: boolean | number
	top?: boolean | number
	[key: string]: any
}

export interface PostStats {
	chineseCount: number
	englishWords: number
	totalWords: number
	readingMinutes: number
	imageCount: number
}

/**
 * 将各类形式的数组字段（如 "[前端, 开发]"、"前端, 开发"、["前端", "开发"]）统一归一化为 string[]
 */
export function parseArrayField(value: any): string[] {
	if (!value) return []
	if (Array.isArray(value)) {
		return value.map(v => String(v).trim()).filter(Boolean)
	}
	if (typeof value === 'string') {
		const trimmed = value.trim()
		if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
			const inner = trimmed.slice(1, -1)
			return inner.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
		}
		if (trimmed.includes(',')) {
			return trimmed.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
		}
		return [trimmed]
	}
	return [String(value).trim()].filter(Boolean)
}

/**
 * 统一清洗 Markdown 文本，剥离 HTML 注释、MDC 自定义指令、代码块与链接，用于纯净字数统计
 */
export function cleanMarkdown(content: string): string {
	if (!content) return ''
	return content
		.replace(/<!--[\s\S]*?-->/g, '') // 去除 HTML 注释
		.replace(/::[\w-]+(?:\[.*?\])?(?:\{.*?\})?/g, '') // 去除 MDC 单行指令
		.replace(/```[\s\S]*?```/g, '') // 去除代码块
		.replace(/`.*?`/g, '') // 去除行内代码
		.replace(/!\[.*?\]\(.*?\)/g, '') // 去除图片
		.replace(/\[(.*?)\]\(.*?\)/g, '$1') // 保留链接文字
		.replace(/[#*`_~>\-+=\\|]/g, '') // 去除标题与粗斜体符号
		.trim()
}

/**
 * 统一计算文章统计数据（汉字数、英文词数、总字数、阅读预估时长）
 */
export function calculatePostStats(rawContent: string): PostStats {
	const cleaned = cleanMarkdown(rawContent)
	const chineseMatches = cleaned.match(/[\u4E00-\u9FA5]/g)
	const chineseCount = chineseMatches ? chineseMatches.length : 0

	const englishMatches = cleaned.match(/[\w-]+/g)
	const englishWords = englishMatches ? englishMatches.length : 0

	const totalWords = chineseCount + englishWords
	const readingMinutes = Math.max(1, Math.ceil(totalWords / 350))

	const imageMatches = rawContent.match(/!\[.*?\]\(.*?\)/g)
	const imageCount = imageMatches ? imageMatches.length : 0

	return {
		chineseCount,
		englishWords,
		totalWords,
		readingMinutes,
		imageCount,
	}
}

/**
 * 归一化 Frontmatter 数据结构，确保各字段类型稳定一致
 */
export function normalizeFrontmatter(data: Record<string, any> = {}): NormalizedFrontmatter {
	const title = String(data.title || '').trim()
	const description = data.description ? String(data.description).trim() : undefined
	const date = data.date ? String(data.date).trim() : undefined
	const updated = data.updated ? String(data.updated).trim() : undefined
	const published = data.published ? String(data.published).trim() : undefined

	const categories = parseArrayField(data.categories)
	const tags = parseArrayField(data.tags)
	const type = String(data.type || 'tech').trim()
	const image = data.image && !String(data.image).startsWith('#') ? String(data.image).trim() : undefined
	const permalink = data.permalink ? String(data.permalink).trim() : undefined
	const draft = Boolean(data.draft)

	return {
		...data,
		title,
		description,
		date,
		updated,
		published,
		categories: categories.length > 0 ? categories : ['前端开发'],
		tags,
		type,
		image,
		permalink,
		draft,
	}
}
