import { Suspense } from 'react'
import { getPostsByStemPrefix } from '@/lib/content'
import PostListClient from '@/app/PostListClient'
import BlogHeader from '@/components/blog/BlogHeader'

export default function HomePage() {
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
