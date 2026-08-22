import { Suspense } from 'react'
import { getPostsByStemPrefix } from '../lib/content'
import PostListClient from './PostListClient'
import BlogHeader from '../components/blog/BlogHeader'
import type { Metadata } from 'next'
import appConfig from '../../blog.config'

export const metadata: Metadata = {
	title: {
		absolute: appConfig.title,
		template: `%s | ${appConfig.title}`
	},
	description: appConfig.description,
	openGraph: {
		images: [appConfig.author.avatar],
	}
}

export default async function HomePage() {
	const allPosts = getPostsByStemPrefix('posts/')
	const previewCount = getPostsByStemPrefix('previews/').length

	return (
		<>
			<BlogHeader className="mobile-only" as="h1" />
			<Suspense fallback={null}>
				<PostListClient allPosts={allPosts} previewCount={previewCount} />
			</Suspense>
		</>
	)
}
