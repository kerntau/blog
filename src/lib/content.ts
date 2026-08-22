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
	if (prefix === 'previews/' || prefix.startsWith('previews')) {
		return getAllPosts().filter(p => !p.draft && p._stem.startsWith('previews/'))
	}
	return getAllPosts().filter(p => !p.draft && p._stem !== 'link' && p._stem !== 'theme' && !p._stem.startsWith('previews/'))
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
	const posts = getPostsByStemPrefix().slice().sort((a, b) => {
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
