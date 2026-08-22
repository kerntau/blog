import { getCompiledMDX } from '../../lib/mdx'
import PostHeader from '../../components/post/PostHeader'
import PostFooter from '../../components/post/PostFooter'
import PostExcerpt from '../../components/post/PostExcerpt'
import PostSurround from '../../components/post/PostSurround'
import ArticleClient from './ArticleClient'
import PostComment from '../../components/post/PostComment'
import { getPostTypeClassName } from '../../utils/article'
import { getAllPosts, getSurroundPosts } from '../../lib/content'
import ZError from '../../components/partial/ZError'
import type { Metadata } from 'next'

export async function generateStaticParams() {
	const posts = getAllPosts()
	return posts
		.filter(post => post.path !== '/link')
		.map((post) => ({
			slug: post.path.split('/').filter(Boolean),
		}))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
	const resolvedParams = await params
	const path = '/' + resolvedParams.slug.join('/')
	const mdx = await getCompiledMDX(path)
	
	if (!mdx) return {}

	const { frontmatter } = mdx
	return {
		title: frontmatter.title,
		description: frontmatter.description,
		openGraph: {
			title: frontmatter.title,
			description: frontmatter.description,
			images: frontmatter.image ? [frontmatter.image] : undefined,
			type: 'article',
		},
	}
}

export default async function PostPage({ params }: { params: Promise<{ slug: string[] }> }) {
	const resolvedParams = await params
	const path = '/' + resolvedParams.slug.join('/')
	const mdx = await getCompiledMDX(path)

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

			{/* 使用 float-in 动画会导致搜索跳转不准确 */}
			<article className={`article ${getPostTypeClassName(frontmatter.type, { prefix: 'md' })}`}>
				{content}
			</article>

			<PostFooter {...frontmatter} />
			<PostSurround {...surrounds} />
			<PostComment />
		</>
	)
}
