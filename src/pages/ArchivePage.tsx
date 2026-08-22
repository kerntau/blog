import { Suspense } from 'react'
import { getPostsByStemPrefix } from '@/lib/content'
import ArchiveClient from '@/app/archive/ArchiveClient'

export default function ArchivePage() {
	const allPosts = getPostsByStemPrefix('posts/')
	return (
		<Suspense fallback={null}>
			<ArchiveClient allPosts={allPosts} />
		</Suspense>
	)
}
