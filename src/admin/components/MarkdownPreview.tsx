import React, { useMemo } from 'react'
import { parseAndRenderClientMdc } from '../utils/clientMdcParser'
import PostHeader from '../../components/post/PostHeader'
import PostFooter from '../../components/post/PostFooter'
import PostExcerpt from '../../components/post/PostExcerpt'
import { getPostTypeClassName } from '../../utils/article'
import type { ArticleProps } from '../../types/article'

interface MarkdownPreviewProps {
	content: string
	frontmatter?: Partial<ArticleProps>
	showChrome?: boolean
	scrollContainerRef?: React.RefObject<HTMLDivElement | null>
}

// 错误边界防止子组件渲染意外异常
class PreviewErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error?: Error }> {
	constructor(props: { children: React.ReactNode }) {
		super(props)
		this.state = { hasError: false }
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error }
	}

	componentDidCatch(error: Error) {
		console.warn('实时预览局部渲染提示:', error)
	}

	render() {
		if (this.state.hasError) {
			return (
				<div
					style={{
						padding: '16px 20px',
						margin: '16px 0',
						borderRadius: '8px',
						background: 'var(--admin-warning-soft)',
						border: '1px solid var(--admin-warning)',
						color: 'var(--admin-warning)',
						fontSize: '13px',
					}}
				>
					<div style={{ fontWeight: 600, marginBottom: 4 }}>渲染容错中</div>
					<div style={{ opacity: 0.85 }}>正在编辑的内容结构暂未闭合，已自动启用弹性容错回退模式。</div>
				</div>
			)
		}
		return this.props.children
	}
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
	content,
	frontmatter = {},
	showChrome = true,
	scrollContainerRef,
}) => {
	// 纯前端 0 延迟即时 Markdown + MDC 宽容解析 (0ms 击键即渲染)
	const { renderedElements } = useMemo(() => {
		if (!content || !content.trim()) {
			return {
				renderedElements: (
					<div
						style={{
							padding: '48px 0',
							textAlign: 'center',
							color: 'var(--admin-text-3)',
							fontSize: '14px',
						}}
					>
						在此输入文章内容，右侧将 0 延迟同源实时呈现...
					</div>
				),
				toc: [],
			}
		}

		try {
			return parseAndRenderClientMdc(content, {
				title: frontmatter.title,
				skipFirstH1: true,
			})
		}
		catch (err: any) {
			console.warn('实时解析异常，回退纯文本:', err)
			return {
				renderedElements: <pre className="mdx-raw-fallback">{content}</pre>,
				toc: [],
			}
		}
	}, [content, frontmatter.title])

	const postTypeClass = getPostTypeClassName(frontmatter.type, { prefix: 'md' })

	return (
		<div
			ref={scrollContainerRef}
			id="admin-preview-scroll-viewport"
			className="admin-live-preview-container"
			style={{
				position: 'relative',
				width: '100%',
				height: '100%',
				overflowY: 'auto',
				scrollBehavior: 'smooth',
			}}
		>
			{/* 前台真实文章容器 (100% 像素级复用) */}
			<div style={{ padding: '24px 24px 48px', maxWidth: 860, margin: '0 auto', width: '100%' }}>
				<PreviewErrorBoundary>
					{showChrome && (
						<>
							{/* 真实 PostHeader */}
							<PostHeader
								path={frontmatter.path || ''}
								title={frontmatter.title || '文章标题'}
								date={frontmatter.date}
								updated={frontmatter.updated}
								categories={frontmatter.categories}
								tags={frontmatter.tags}
								readingTime={{
									text: `${Math.max(1, Math.ceil(content.length / 400))} min read`,
									minutes: Math.max(1, Math.ceil(content.length / 400)),
									time: Math.max(1, Math.ceil(content.length / 400)) * 60000,
									words: content.length,
								}}
								image={frontmatter.image}
							/>

							{/* 真实 PostExcerpt */}
							{frontmatter.description && (
								<PostExcerpt excerpt={frontmatter.description} />
							)}
						</>
					)}

					{/* 真实 PostArticle 样式上下文 */}
					<article className={`article ${postTypeClass}`} style={{ marginTop: showChrome ? 20 : 0 }}>
						{renderedElements}
					</article>

					{showChrome && frontmatter.title && (
						<div style={{ marginTop: 36 }}>
							<PostFooter
								path={frontmatter.path || ''}
								title={frontmatter.title}
								date={frontmatter.date}
								updated={frontmatter.updated}
								categories={frontmatter.categories}
								tags={frontmatter.tags}
							/>
						</div>
					)}
				</PreviewErrorBoundary>
			</div>
		</div>
	)
}

export default MarkdownPreview
