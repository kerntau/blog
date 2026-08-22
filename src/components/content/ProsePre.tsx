'use client'

import React, { useState, useRef, useMemo } from 'react'
import { Icon } from '@iconify/react'
import useCopy from '../../hooks/useCopy'
import { formatBytes } from '../../utils/str'
import { getFileIcon, getLangIcon } from '../../utils/icon'
import appConfig from '../../app.config'
import styles from './ProsePre.module.scss'

export interface ProsePreProps {
	children?: React.ReactNode
	className?: string
	style?: React.CSSProperties
	code?: string
	language?: string
	filename?: string
	meta?: string
	'data-language'?: string
	'data-theme'?: string
	[key: string]: any
}

export function ProsePre({
	children,
	className = '',
	style,
	code: propsCode,
	language: propsLanguage,
	filename,
	meta: propsMeta = '',
	...props
}: ProsePreProps) {
	const [isWrap, setIsWrap] = useState(false)
	const preRef = useRef<HTMLPreElement>(null)

	const rawCode = useMemo(() => {
		if (propsCode !== undefined) return propsCode
		if (typeof children === 'string') return children
		return ''
	}, [propsCode, children])

	const compConf = appConfig.component.codeblock

	// 计算行数
	const rows = useMemo(() => {
		if (rawCode) return rawCode.split('\n').length
		if (preRef.current) return (preRef.current.textContent || '').split('\n').length
		return 1
	}, [rawCode])

	const collapsible = !propsMeta.includes('expand') && rows > compConf.triggerRows
	const [isCollapsed, setIsCollapsed] = useState(collapsible)

	const detectedLang = useMemo(() => {
		if (propsLanguage) return propsLanguage
		if (props['data-language']) return props['data-language']
		const match = className.match(/language-([\w-]+)/i)
		if (match) return match[1]
		return ''
	}, [propsLanguage, props, className])

	const icon = useMemo(() => {
		if (filename) return getFileIcon(filename) || 'tabler:file-code'
		if (detectedLang) return getLangIcon(detectedLang) || 'tabler:file-code'
		return 'tabler:file-code'
	}, [filename, detectedLang])

	const byteSize = useMemo(() => {
		const text = rawCode || (preRef.current ? preRef.current.textContent || '' : '')
		return formatBytes(new TextEncoder().encode(text).length)
	}, [rawCode])

	const { isCopied, copy } = useCopy(rawCode || preRef)

	const handleCopy = () => {
		copy()
	}

	return (
		<figure
			className={`z-codeblock ${styles.zCodeblock} ${collapsible ? styles.collapsible : ''} ${collapsible ? 'collapsible' : ''} ${collapsible && isCollapsed ? `${styles.collapsed} collapsed` : ''} ${className}`}
			style={{
				'--collapsed-rows': compConf.collapsedRows,
				'--tab-size': compConf.tabSize,
				...style,
			} as any}
		>
			<figcaption className={styles.figcaption}>
				{filename ? (
					<span className={styles.filename}>
						<Icon icon={icon} /> <span>{filename}</span>
					</span>
				) : (
					<span />
				)}

				{detectedLang && <span className={styles.language}>{detectedLang}</span>}

				<div className={styles.operations}>
					<button type="button" onClick={() => setIsWrap(!isWrap)}>
						{isWrap ? '换行' : '自动'}
					</button>
					<button type="button" onClick={handleCopy}>
						{isCopied ? '已复制' : '复制'}
					</button>
				</div>
			</figcaption>

			<pre
				ref={preRef}
				{...props}
				className={`${className} ${isWrap ? styles.wrap : ''} ${isWrap ? 'wrap' : ''} shiki scrollcheck-x`}
			>
				{children}
			</pre>

			{collapsible && (
				<button
					type="button"
					className={styles.toggleBtn}
					aria-label={isCollapsed ? '展开代码块' : '折叠代码块'}
					onClick={() => setIsCollapsed(!isCollapsed)}
				>
					<Icon
						className={`${styles.toggleIcon} ${isCollapsed ? styles.isCollapsed : ''}`}
						icon="tabler:chevrons-up"
					/>
					<span>
						{rows} lines, {rawCode ? rawCode.length : ''} chars, {byteSize}
					</span>
				</button>
			)}
		</figure>
	)
}

export default ProsePre
