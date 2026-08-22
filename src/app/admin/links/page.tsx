/* eslint-disable style/max-statements-per-line */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import LinksClient from './LinksClient'

function extractLinks(source: string) {
	return [...source.matchAll(/(?:title|name):\s*["']?([^\n"']+)["']?[\s\S]{0,500}?(?:link|url):\s*["']?(https?:\/\/[^\s"']+)/g)].map(match => ({ title: match[1]!.trim(), url: match[2]!.trim() }))
}
export default async function LinksPage() {
	let links: Array<{ title: string, url: string }> = []
	try { links = extractLinks(await readFile(join(process.cwd(), 'content', 'link.mdx'), 'utf8')) } catch { /* empty state is rendered by the client */ }
	return <LinksClient links={links} />
}
