import { useLocation } from 'react-router-dom'
import { getCompiledMDX } from '@/lib/mdx'
import PostHeader from '@/components/post/PostHeader'
import PostFooter from '@/components/post/PostFooter'
import PostExcerpt from '@/components/post/PostExcerpt'
import PostSurround from '@/components/post/PostSurround'
import ArticleClient from '@/app/[...slug]/ArticleClient'
import PostComment from '@/components/post/PostComment'
import { getPostTypeClassName } from '@/utils/article'
import { getSurroundPosts } from '@/lib/content'
import ZError from '@/components/partial/ZError'

export default function PostPage() {
	const location = useLocation()
	const path = location.pathname
	const mdx = getCompiledMDX(path)

	if (!mdx) {
		return (
			<>
				<ArticleClient toc={[]} aside={['blog-log']} />
				<ZError
					icon="line-md:document-delete-twotone"
					title="内容为空或页面不存在"
				/>
			</>
		)
	}

	const { content, frontmatter, toc } = mdx
	const surrounds = getSurroundPosts(path)

	return (
		<>
			<ArticleClient toc={toc} aside={frontmatter.meta?.aside} />
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
