import { Suspense } from 'react'
import { getPostsByStemPrefix } from '@/lib/content'
import PreviewClient from '@/app/preview/PreviewClient'

export default function PreviewPage() {
	const allPosts = getPostsByStemPrefix('previews/')
	return (
		<Suspense fallback={null}>
			<PreviewClient allPosts={allPosts} />
		</Suspense>
	)
}
