import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import type { ArticleProps } from '../types/article'
import { sumBy } from 'es-toolkit/math'
import { groupBy } from 'es-toolkit/array'
import { toZonedTemporal } from '../utils/time'
import blogConfig from '../../blog.config'
import readingTimeOverrides from '../data/reading-time-overrides.json'

const contentDir = join(process.cwd(), 'content')
const dateFields = ['date', 'updated', 'published'] as const

export interface ParsedPost extends ArticleProps {
	_filePath: string
	_stem: string
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

export function getAllPosts(): ParsedPost[] {
	const posts: ParsedPost[] = []

	function traverse(dir: string) {
		const files = readdirSync(dir)
		for (const file of files) {
			const fullPath = join(dir, file)
			if (statSync(fullPath).isDirectory()) {
				traverse(fullPath)
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

				posts.push({
					categories: [blogConfig.defaultCategory],
					tags: [],
					type: Object.keys(blogConfig.article.types)[0],
					draft: false,
					...(data as ArticleProps),
					path: relativePath,
					_filePath: fullPath,
					_stem: stem,
				})
			}
		}
	}

	traverse(contentDir)
	// Default sort by date desc
	return posts.sort((a, b) => {
		const dateA = String(a.date || a.published || '')
		const dateB = String(b.date || b.published || '')
		return dateB.localeCompare(dateA)
	})
}

export function getPostsByStemPrefix(prefix = 'posts/') {
	return getAllPosts().filter(p => p._stem.startsWith(prefix))
}

export function getPostByPath(path: string) {
	const searchPath = path.startsWith('/') ? path : `/${path}`
	const posts = getAllPosts()
	const postMeta = posts.find(p => p.path === searchPath)
	
	if (!postMeta) return null

	try {
		const content = readFileSync(postMeta._filePath, 'utf-8')
		const { data: rawData, content: body } = matter(content)
		const data = normalizeArticleData(rawData, content)
		return { 
			data: { ...data, path: postMeta.path, readingTime: postMeta.readingTime } as ArticleProps, 
			body 
		}
	} catch {
		return null
	}
}

export function getSurroundPosts(path: string) {
	const posts = getPostsByStemPrefix('posts/').sort((a, b) => {
		const dateA = String(a.date || a.published || '')
		const dateB = String(b.date || b.published || '')
		return dateA.localeCompare(dateB)
	})
	const index = posts.findIndex(p => p.path === path)
	if (index === -1) return { prev: null, next: null }
	
	// posts 是升序排列 (旧文章在前)，用于生成上一篇/下一篇导航
	return {
		prev: posts[index - 1] || null,
		next: posts[index + 1] || null,
	}
}

export function getStats() {
	const posts = getPostsByStemPrefix('posts/')
	const totalWords = sumBy(posts, p => p.readingTime?.words ?? 0)
	
	const annual: Record<string, { posts: number, words: number }> = {}
	const grouped = groupBy(posts, p => {
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
			posts: posts.length,
			words: totalWords,
		},
		annual,
	}
}
