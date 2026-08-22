import React, { useState, useEffect } from 'react'

interface MarkdownPreviewProps {
	content: string
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
	// 100ms 优雅轻量防抖，提升长文本打字时的交互帧率
	const [debouncedContent, setDebouncedContent] = useState(content)

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedContent(content)
		}, 100)
		return () => clearTimeout(timer)
	}, [content])

	// 轻量高效 Markdown / MDC 快速解析器，供双栏实时预览使用
	const renderContent = (raw: string) => {
		const lines = raw.split('\n')
		const elements: React.ReactNode[] = []
		let inCodeBlock = false
		let codeLang = ''
		let codeBuffer: string[] = []

		let inMdcBlock = false
		let mdcType = ''
		let mdcBuffer: string[] = []

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]!

			// 代码块判定
			if (line.startsWith('```')) {
				if (!inCodeBlock) {
					inCodeBlock = true
					codeLang = line.slice(3).trim()
					codeBuffer = []
				}
				else {
					inCodeBlock = false
					elements.push(
						<div
							key={`code-${i}`}
							style={{
								background: '#0d1117',
								border: '1px solid var(--admin-border)',
								borderRadius: 6,
								margin: '10px 0',
								overflow: 'hidden',
							}}
						>
							{codeLang && (
								<div
									style={{
										padding: '4px 10px',
										fontSize: 11,
										color: '#8b949e',
										background: '#161b22',
										borderBottom: '1px solid #30363d',
										fontWeight: 600,
										fontFamily: 'var(--admin-font-mono)',
									}}
								>
									{codeLang}
								</div>
							)}
							<pre style={{ margin: 0, padding: 10, overflowX: 'auto', fontSize: 12, lineHeight: 1.5, color: '#c9d1d9', fontFamily: 'var(--admin-font-mono)' }}>
								<code>{codeBuffer.join('\n')}</code>
							</pre>
						</div>,
					)
				}
				continue
			}

			if (inCodeBlock) {
				codeBuffer.push(line)
				continue
			}

			// MDC 自定义块判定 (::alert, ::folding, ::timeline 等)
			if (line.startsWith('::') && !line.startsWith(':: ')) {
				const match = line.match(/^::([\w-]+)/)
				if (match) {
					inMdcBlock = true
					mdcType = match[1] || 'block'
					mdcBuffer = []
					continue
				}
			}

			if (inMdcBlock) {
				if (/^::\s*$/.test(line)) {
					inMdcBlock = false
					elements.push(
						<div
							key={`mdc-${i}`}
							style={{
								borderLeft: '3px solid var(--admin-accent)',
								background: 'var(--admin-accent-soft)',
								padding: '8px 12px',
								borderRadius: '0 6px 6px 0',
								margin: '10px 0',
							}}
						>
							<div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-accent)', marginBottom: 4, textTransform: 'uppercase' }}>
								MDC 组件: {mdcType}
							</div>
							<div style={{ fontSize: 12, color: 'var(--admin-text-1)', whiteSpace: 'pre-wrap' }}>
								{mdcBuffer.join('\n')}
							</div>
						</div>,
					)
					continue
				}
				mdcBuffer.push(line)
				continue
			}

			// 图片渲染
			const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)/)
			if (imgMatch) {
				elements.push(
					<div key={`img-${i}`} style={{ margin: '10px 0', textAlign: 'center' }}>
						<img
							src={imgMatch[2]}
							alt={imgMatch[1]}
							style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--admin-border)' }}
						/>
						{imgMatch[1] && <div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 4 }}>{imgMatch[1]}</div>}
					</div>,
				)
				continue
			}

			// 标题判定
			if (line.startsWith('# ')) {
				elements.push(<h1 key={i} style={{ fontSize: 18, fontWeight: 700, margin: '16px 0 8px', borderBottom: '1px solid var(--admin-border)', paddingBottom: 6 }}>{line.slice(2)}</h1>)
			}
			else if (line.startsWith('## ')) {
				elements.push(<h2 key={i} style={{ fontSize: 15, fontWeight: 700, margin: '14px 0 6px' }}>{line.slice(3)}</h2>)
			}
			else if (line.startsWith('### ')) {
				elements.push(<h3 key={i} style={{ fontSize: 13, fontWeight: 600, margin: '12px 0 4px' }}>{line.slice(4)}</h3>)
			}
			else if (line.startsWith('- ')) {
				elements.push(
					<li key={i} style={{ marginLeft: 18, marginBlock: 2, fontSize: 12, color: 'var(--admin-text-1)' }}>
						{line.slice(2)}
					</li>,
				)
			}
			else if (line.startsWith('> ')) {
				elements.push(
					<blockquote
						key={i}
						style={{
							margin: '8px 0',
							padding: '6px 10px',
							borderLeft: '3px solid var(--admin-text-3)',
							background: 'var(--admin-bg-subtle)',
							color: 'var(--admin-text-2)',
							borderRadius: '0 4px 4px 0',
							fontSize: 12,
						}}
					>
						{line.slice(2)}
					</blockquote>,
				)
			}
			else if (line.trim()) {
				elements.push(
					<p key={i} style={{ margin: '6px 0', fontSize: 12, lineHeight: 1.6, color: 'var(--admin-text-1)' }}>
						{line}
					</p>,
				)
			}
		}

		return elements
	}

	return (
		<div style={{ height: '100%', overflowY: 'auto', padding: 16, lineHeight: 1.5 }}>
			{debouncedContent.trim() ? (
				renderContent(debouncedContent)
			) : (
				<div style={{ color: 'var(--admin-text-3)', textAlign: 'center', marginTop: 60, fontSize: 12 }}>
					暂无预览内容，在左侧输入 Markdown 正文...
				</div>
			)}
		</div>
	)
}

export default MarkdownPreview
