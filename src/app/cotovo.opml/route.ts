import { NextResponse } from 'next/server'
import XmlBuilder from 'fast-xml-builder'
import blogConfig, { myFeed } from '../../../blog.config'
import feeds from '../../feeds'
import { toZonedTemporal } from '../../utils/time'

export const dynamic = 'force-static'

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

export async function GET() {
	const outlines = [
		mapEntry(myFeed),
		...feeds.flatMap(({ entries }: any) => entries.filter((e: any) => e.feed).map(mapEntry))
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

	const xml = builder.build({
		'?xml': { $version: '1.0', $encoding: 'UTF-8' },
		opml,
	})

	return new NextResponse(xml, {
		headers: {
			'Content-Type': 'application/xml',
		},
	})
}
