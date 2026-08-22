/* eslint-disable style/max-statements-per-line, regexp/no-unused-capturing-group */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, join, relative, sep } from 'node:path'
import { getAllPosts } from './content'

const contentRoot = join(process.cwd(), 'content')
const publicRoot = join(process.cwd(), 'public')

export function getAdminOverview() {
	const posts = getAllPosts().filter(post => post._stem.startsWith('posts/'))
	const drafts = posts.filter(post => post.draft)
	const missingCover = posts.filter(post => !(post as any).cover).length
	const missingDescription = posts.filter(post => !post.description).length
	const brokenImages = posts.reduce((count, post) => { const cover = (post as any).cover as string | undefined; return count + (cover && cover.startsWith('/') && !existsSync(join(publicRoot, cover)) ? 1 : 0) }, 0)
	return { posts, drafts, health: { missingCover, missingDescription, brokenImages, brokenLinks: 0 } }
}

export function getMediaFiles() {
	const files: Array<{ path: string, name: string, extension: string }> = []
	function walk(directory: string) {
		for (const entry of readdirSync(directory)) {
			const fullPath = join(directory, entry)
			if (statSync(fullPath).isDirectory()) walk(fullPath)
			else if (/\.(avif|gif|jpe?g|png|webp)$/i.test(entry)) files.push({ path: `/${relative(publicRoot, fullPath).split(sep).join('/')}`, name: basename(entry), extension: extname(entry).slice(1) })
		}
	}
	walk(publicRoot)
	return files
}

export const frontIcons = ['tabler:circle-dashed', 'tabler:mouse', 'tabler:code', 'tabler:bug', 'tabler:message', 'tabler:leaf', 'tabler:article', 'tabler:book', 'tabler:terminal-2', 'tabler:bulb', 'tabler:folder', 'tabler:rocket']

export function getContentRoot() { return contentRoot }
