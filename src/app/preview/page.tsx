import { Suspense } from 'react'
import { getPostsByStemPrefix } from '../../lib/content'
import PreviewClient from './PreviewClient'
import type { Metadata } from 'next'
import appConfig from '../../../blog.config'

export const metadata: Metadata = {
	title: '预览',
	description: `${appConfig.title}的文章预览。`,
}

export default async function PreviewPage() {
	const allPosts = getPostsByStemPrefix('previews/')
	return (
		<Suspense fallback={null}>
			<PreviewClient allPosts={allPosts} />
		</Suspense>
	)
}
