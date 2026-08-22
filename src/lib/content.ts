import type { ArticleProps } from '../types/article'
import generatedData from '../data/generated-posts.json'

export interface ParsedPost extends ArticleProps {
	_filePath: string
	_stem: string
	body?: string
	toc?: { depth: number, text: string, id: string }[]
}

export function getAllPosts(): ParsedPost[] {
	return (generatedData.posts || []) as ParsedPost[]
}

export function getPostsByStemPrefix(prefix = 'posts/'): ParsedPost[] {
	return getAllPosts().filter(p => p._stem.startsWith(prefix))
}

export function getPostByPath(path: string) {
	const searchPath = path.startsWith('/') ? path : `/${path}`
	const posts = getAllPosts()
	const postMeta = posts.find(p => p.path === searchPath)

	if (!postMeta) return null

	return {
		data: { ...postMeta } as ArticleProps,
		body: postMeta.body || '',
		toc: postMeta.toc || [],
	}
}

export function getSurroundPosts(path: string) {
	const posts = getPostsByStemPrefix('posts/').slice().sort((a, b) => {
		const dateA = String(a.date || a.published || '')
		const dateB = String(b.date || b.published || '')
		return dateA.localeCompare(dateB)
	})
	const index = posts.findIndex(p => p.path === path)
	if (index === -1) return { prev: null, next: null }

	return {
		prev: posts[index - 1] || null,
		next: posts[index + 1] || null,
	}
}

export function getStats() {
	return generatedData.stats || {
		total: { posts: 0, words: 0 },
		annual: {},
	}
}
