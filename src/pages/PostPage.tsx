import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getCompiledMDX } from '@/lib/mdx'
import PostHeader from '@/components/post/PostHeader'
import PostFooter from '@/components/post/PostFooter'
import PostExcerpt from '@/components/post/PostExcerpt'
import PostSurround from '@/components/post/PostSurround'
import PostComment from '@/components/post/PostComment'
import { getPostTypeClassName } from '@/utils/article'
import { getSurroundPosts } from '@/lib/content'
import { useLayoutStore } from '@/stores/layout'
import ZError from '@/components/partial/ZError'

export default function PostPage() {
	const location = useLocation()
	const path = location.pathname
	const mdx = getCompiledMDX(path)
	const setToc = useLayoutStore(s => s.setToc)
	const setAside = useLayoutStore(s => s.setAside)

	const toc = mdx?.toc || []
	const aside = mdx?.frontmatter?.meta?.aside || (mdx ? ['toc'] : ['blog-log'])

	useEffect(() => {
		setToc(toc)
		setAside(aside)
		return () => {
			setToc([])
			setAside(['blog-stats'])
		}
	}, [toc, aside, setToc, setAside])

	if (!mdx) {
		return (
			<ZError
				icon="line-md:document-delete-twotone"
				title="内容为空或页面不存在"
			/>
		)
	}

	const { content, frontmatter } = mdx
	const surrounds = getSurroundPosts(path)

	return (
		<>
			<PostHeader {...frontmatter} />

			{frontmatter.description && (
				<PostExcerpt excerpt={frontmatter.description} />
			)}

			<article className={`article ${getPostTypeClassName(frontmatter.type, { prefix: 'md' })}`}>
				{content}
			</article>

			<PostFooter {...frontmatter} />
			<PostSurround {...surrounds} />
			<PostComment />
		</>
	)
}
