import React, { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import { renderCompiledMdx } from '../../lib/mdx'
import PostHeader from '../../components/post/PostHeader'
import PostFooter from '../../components/post/PostFooter'
import PostExcerpt from '../../components/post/PostExcerpt'
import { getPostTypeClassName } from '../../utils/article'
import type { ArticleProps } from '../../types/article'

interface MarkdownPreviewProps {
	content: string
	frontmatter?: Partial<ArticleProps>
	showChrome?: boolean
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
	content,
	frontmatter = {},
	showChrome = true,
}) => {
	const [debouncedContent, setDebouncedContent] = useState(content)
	const [compiledCode, setCompiledCode] = useState<string>('')
	const [compileError, setCompileError] = useState<string | null>(null)
	const [compiling, setCompiling] = useState(false)
	const latestReqId = useRef(0)

	// 150ms 防抖更新
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedContent(content)
		}, 150)
		return () => clearTimeout(timer)
	}, [content])

	// 触发后端同源 MDX 编译管道
	useEffect(() => {
		if (!debouncedContent.trim()) {
			setCompiledCode('')
			setCompileError(null)
			return
		}

		const reqId = ++latestReqId.current
		setCompiling(true)

		adminApi.compilePostMdx(debouncedContent, frontmatter.title)
			.then((res) => {
				if (reqId === latestReqId.current) {
					if (res && res.compiledCode) {
						setCompiledCode(res.compiledCode)
						setCompileError(null)
					}
					else {
						setCompiledCode('')
					}
				}
			})
			.catch((err) => {
				if (reqId === latestReqId.current) {
					setCompileError(err.message || 'MDX 编译异常')
				}
			})
			.finally(() => {
				if (reqId === latestReqId.current) {
					setCompiling(false)
				}
			})
	}, [debouncedContent, frontmatter.title])

	// 使用前台同源 renderCompiledMdx 运行 React JSX runner
	const renderedMdxContent = renderCompiledMdx(compiledCode, debouncedContent)

	const postTypeClass = getPostTypeClassName(frontmatter.type, { prefix: 'md' })

	return (
		<div className="admin-live-preview-container" style={{ position: 'relative', width: '100%', minHeight: '100%' }}>
			{/* 编译中与错误指示微标 */}
			<div
				style={{
					position: 'sticky',
					top: 8,
					right: 8,
					zIndex: 10,
					display: 'flex',
					justifyContent: 'flex-end',
					pointerEvents: 'none',
					paddingRight: 10,
				}}
			>
				{compiling && (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 4,
							background: 'var(--admin-surface)',
							border: '1px solid var(--admin-border)',
							padding: '3px 8px',
							borderRadius: 12,
							fontSize: 11,
							color: 'var(--admin-text-3)',
							boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
						}}
					>
						<Icon icon="tabler:loader-2" style={{ animation: 'spin 1s linear infinite' }} />
						<span>同源编译中...</span>
					</div>
				)}
			</div>

			{/* MDX 语法错误横条 */}
			{compileError && (
				<div
					style={{
						margin: '8px 16px',
						padding: '8px 12px',
						background: 'var(--admin-danger-soft)',
						border: '1px solid var(--admin-danger)',
						borderRadius: 6,
						color: 'var(--admin-danger)',
						fontSize: 12,
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
						<Icon icon="tabler:alert-triangle" />
						<span>MDX 语法解析提示（正在展示回退视图）</span>
					</div>
					<div style={{ marginTop: 4, fontSize: 11, fontFamily: 'var(--admin-font-mono)' }}>
						{compileError}
					</div>
				</div>
			)}

			{/* 前台真实文章容器 (100% 像素级复用) */}
			<div style={{ padding: '24px 20px', maxWidth: 840, margin: '0 auto', width: '100%' }}>
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
								text: `${Math.ceil(debouncedContent.length / 400)} min read`,
								minutes: Math.ceil(debouncedContent.length / 400),
								time: Math.ceil(debouncedContent.length / 400) * 60000,
								words: debouncedContent.length,
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
				<article className={`article ${postTypeClass}`} style={{ marginTop: showChrome ? 16 : 0 }}>
					{renderedMdxContent}
				</article>

				{showChrome && frontmatter.title && (
					<div style={{ marginTop: 32 }}>
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
			</div>
		</div>
	)
}

export default MarkdownPreview
