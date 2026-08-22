import { NextResponse } from 'next/server'
import XmlBuilder from 'fast-xml-builder'
import blogConfig from '../../../blog.config'
import packageJson from '../../../package.json'
import { getAllPosts } from '../../lib/content'
import { toZonedTemporal } from '../../utils/time'

export const dynamic = 'force-static'

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

export async function GET() {
	const posts = getAllPosts().filter(p => p.path.startsWith('/posts/')).slice(0, blogConfig.feed.limit)

	const entries = posts.map(post => ({
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
			_: 'Cotovo Blog Engine',
		},
		icon: blogConfig.favicon,
		logo: blogConfig.author.avatar,
		rights: `© ${new Date().getFullYear()} ${blogConfig.author.name}`,
		subtitle: blogConfig.subtitle || blogConfig.description,
		entry: entries,
	}

	const xml = builder.build({
		'?xml': { $version: '1.0', $encoding: 'UTF-8' },
		feed,
	})

	return new NextResponse(xml, {
		headers: {
			'Content-Type': 'application/xml',
		},
	})
}
