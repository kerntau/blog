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
	'data-filename'?: string
	'data-meta'?: string
	'data-theme'?: string
	[key: string]: any
}

export function ProsePre({
	children,
	className = '',
	style,
	code: propsCode,
	language: propsLanguage,
	filename: propsFilename,
	meta: propsMeta = '',
	'data-filename': dataFilename,
	'data-language': dataLanguage,
	'data-meta': dataMeta,
	...props
}: ProsePreProps) {
	const preRef = useRef<HTMLPreElement>(null)

	// 解析 meta 属性字符串 (如 "icon=... wrap expand indent=2")
	const rawMetaStr = propsMeta || dataMeta || ''
	const meta = useMemo(() => {
		const result: Record<string, any> = {}
		const bracketMatch = rawMetaStr.match(/\[(.*?)\]/)
		if (bracketMatch) result.filename = bracketMatch[1]

		rawMetaStr
			.replace(/\[.*?\]/g, '')
			.trim()
			.split(/\s+/)
			.filter(Boolean)
			.forEach((item: string) => {
				const [key, value] = item.split('=')
				if (key) {
					result[key] = value !== undefined ? value.replace(/^['"]|['"]$/g, '') : true
				}
			})
		return result
	}, [rawMetaStr])

	const [isWrap, setIsWrap] = useState(Boolean(meta.wrap))

	const rawCode = useMemo(() => {
		if (propsCode !== undefined) return propsCode
		if (typeof children === 'string') return children
		return ''
	}, [propsCode, children])

	const compConf = appConfig.component.codeblock

	// 解析文件名与语言
	const filename = propsFilename || dataFilename || meta.filename || meta.title || ''
	const detectedLang = useMemo(() => {
		if (propsLanguage) return propsLanguage
		if (dataLanguage) return dataLanguage
		if (props['data-language']) return props['data-language']
		const match = className.match(/language-([\w-]+)/i)
		if (match) return match[1]
		return ''
	}, [propsLanguage, dataLanguage, props, className])

	const icon = useMemo(() => {
		if (meta.icon) return meta.icon
		if (filename) return getFileIcon(filename) || 'tabler:file-code'
		if (detectedLang) return getLangIcon(detectedLang) || 'tabler:file-code'
		return 'tabler:file-code'
	}, [meta.icon, filename, detectedLang])

	// 计算代码行数
	const rows = useMemo(() => {
		if (rawCode) return Math.max(1, rawCode.split('\n').length - 1)
		if (preRef.current) {
			const lineNodes = preRef.current.querySelectorAll('.line')
			if (lineNodes.length > 0) return lineNodes.length
			return Math.max(1, (preRef.current.textContent || '').split('\n').length - 1)
		}
		return 1
	}, [rawCode])

	const collapsible = !meta.expand && rows > compConf.triggerRows
	const [isCollapsed, setIsCollapsed] = useState(collapsible)

	const codeChars = useMemo(() => {
		if (rawCode) return rawCode.length
		if (preRef.current) return (preRef.current.textContent || '').length
		return 0
	}, [rawCode])

	const byteSize = useMemo(() => {
		const text = rawCode || (preRef.current ? preRef.current.textContent || '' : '')
		return formatBytes(new TextEncoder().encode(text).length)
	}, [rawCode])

	const cleanChildren = useMemo(() => {
		if (React.isValidElement(children)) {
			const childProps = children.props as any
			if (childProps && childProps.children) {
				const subChildren = React.Children.toArray(childProps.children).filter(
					child => typeof child !== 'string' || child.trim() !== '',
				)
				return React.cloneElement(children as any, {}, subChildren)
			}
		}
		if (Array.isArray(children)) {
			return children.filter(child => typeof child !== 'string' || child.trim() !== '')
		}
		return children
	}, [children])

	const { isCopied, copy } = useCopy(preRef)

	return (
		<figure
			className={`z-codeblock ${styles.zCodeblock} ${collapsible ? styles.collapsible : ''} ${collapsible ? 'collapsible' : ''} ${collapsible && isCollapsed ? `${styles.collapsed} collapsed` : ''} ${className}`}
			style={{
				'--collapsed-rows': compConf.collapsedRows,
				'--tab-size': meta.indent || compConf.tabSize,
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
						{isWrap ? '单行' : '自动换行'}
					</button>
					<button type="button" onClick={() => copy()}>
						{isCopied ? '已复制' : '复制'}
					</button>
				</div>
			</figcaption>

			<pre
				ref={preRef}
				{...props}
				className={`${className} ${isWrap ? styles.wrap : ''} ${isWrap ? 'wrap' : ''} shiki scrollcheck-x`}
			>
				{cleanChildren}
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
						{rows} lines, {codeChars} chars, {byteSize}
					</span>
				</button>
			)}
		</figure>
	)
}

export default ProsePre
