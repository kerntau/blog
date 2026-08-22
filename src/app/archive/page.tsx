import { Suspense } from 'react'
import { getPostsByStemPrefix } from '../../lib/content'
import ArchiveClient from './ArchiveClient'
import type { Metadata } from 'next'
import appConfig from '../../../blog.config'

export const metadata: Metadata = {
	title: '归档',
	description: `${appConfig.title}的所有文章归档。`,
}

export default async function ArchivePage() {
	const allPosts = getPostsByStemPrefix('posts/')
	return (
		<Suspense fallback={null}>
			<ArchiveClient allPosts={allPosts} />
		</Suspense>
	)
}
