'use client'

import { useState, useRef } from 'react'
import { Icon } from '@iconify/react'
import styles from './ProsePre.module.scss'

interface ProsePreProps {
	children?: React.ReactNode
	className?: string
	style?: React.CSSProperties
	// Shiki / Rehype 注入的 props
	'data-language'?: string
	'data-theme'?: string
	[key: string]: any
}

export default function ProsePre({
	children,
	className = '',
	style,
	...props
}: ProsePreProps) {
	const [isWrap, setIsWrap] = useState(false)
	const [copied, setCopied] = useState(false)
	const preRef = useRef<HTMLPreElement>(null)

	const language = props['data-language'] || ''
	const filename = props.filename || '' // 假设元数据被解析到了 props

	const handleCopy = () => {
		if (!preRef.current) return
		const code = preRef.current.textContent ?? ''
		navigator.clipboard.writeText(code).then(() => {
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		})
	}

	return (
		<figure
			className={`${styles.zCodeblock} ${className}`}
			style={style}
		>
			<figcaption className={styles.figcaption}>
				<span className={styles.filename}>
					{filename && <><Icon icon="tabler:file-code" /> {filename}</>}
				</span>

				<span className={styles.language}>{language}</span>

				<div className={styles.operations}>
					<button onClick={() => setIsWrap(!isWrap)}>
						{isWrap ? '横向滚动' : '自动换行'}
					</button>
					<button onClick={handleCopy}>
						{copied ? '已复制' : '复制'}
					</button>
				</div>
			</figcaption>

			<pre
				ref={preRef}
				{...props}
				className={`${className} ${isWrap ? styles.wrap : ''} scrollcheck-x`}
			>
				{children}
			</pre>
		</figure>
	)
}
