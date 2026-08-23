import React, { createElement, type ReactNode } from 'react'
import { defaultMdxComponents } from '../../lib/mdx'
import GithubSlugger from 'github-slugger'

/** 解析 MDC 容器内的 YAML 属性字符串 */
export function parseClientYamlProps(yamlStr: string): Record<string, any> {
	const props: Record<string, any> = {}
	const lines = yamlStr.split('\n')
	for (const line of lines) {
		const m = line.match(/^([\w-]+):\s*(.*)$/)
		if (m) {
			const key = m[1]!.trim()
			let val = m[2]!.trim()
			if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
				val = val.slice(1, -1)
			}
			else if (val === 'true') {
				val = true as any
			}
			else if (val === 'false') {
				val = false as any
			}
			else if (!Number.isNaN(Number(val)) && val !== '') {
				val = Number(val) as any
			}
			props[key] = val
		}
	}
	return props
}

/** 解析 MDC 行内/块级属性字符串 如 type="warning" title="提示" :count="5" */
export function parseClientInlineProps(propsStr: string): Record<string, any> {
	const props: Record<string, any> = {}
	if (!propsStr) return props

	const regex = /:?([\w-]+)=(?:(['"])(.*?)\2|(\{.*?\})|(\S+))/g
	let match = regex.exec(propsStr)

	while (match !== null) {
		const key = match[1]!
		let val: any = match[3] ?? match[4] ?? match[5]
		if (val === 'true') {
			val = true
		}
		else if (val === 'false') {
			val = false
		}
		else if (!Number.isNaN(Number(val)) && val !== '') {
			val = Number(val)
		}
		else if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
			try {
				val = JSON.parse(val.slice(1, -1))
			}
			catch {
				val = val.slice(1, -1)
			}
		}
		props[key] = val
		match = regex.exec(propsStr)
	}
	return props
}

export interface TocHeading {
	depth: number
	text: string
	id: string
}

/**
 * 行内 Markdown / MDC 解析器
 * 支持加粗、斜体、删除线、行内代码、图片、链接、MDC行内组件
 */
export function renderInlineMarkdown(text: string, keyPrefix = 'inline'): ReactNode[] {
	if (!text) return []

	const nodes: ReactNode[] = []
	let cursor = 0
	let nodeIdx = 0

	// 正则匹配所有行内元素
	// 1. 行内 MDC :comp[text]{props}
	// 2. 行内 MDC 无文案 :comp{props}
	// 3. 图片 ![alt](src)
	// 4. 链接 [text](href)
	// 5. 加粗 **bold** 或 __bold__
	// 6. 斜体 *italic* 或 _italic_
	// 7. 删除线 ~~del~~
	// 8. 行内代码 `code`
	const inlineRegex = /(:([a-z][\w-]*)\[(.*?)\](?:\{((?:[^{}]|"[^"]*"|'[^']*')*)\})?)|(:([a-z][\w-]*)(\{[^}\n]*\}))|(!\[(.*?)\]\((.*?)\))|(\[(.*?)\]\((.*?)\))|(\*\*(.*?)\*\*|__(.*?)__)|(\*(.*?)\*|_(.*?)_)|(~~(.*?)~~)|(`([^`]+)`)/g

	let match = inlineRegex.exec(text)
	while (match !== null) {
		const matchStart = match.index
		const matchEnd = matchStart + match[0].length

		if (matchStart > cursor) {
			nodes.push(text.slice(cursor, matchStart))
		}

		const key = `${keyPrefix}-${nodeIdx++}`

		if (match[1]) {
			// 1. 行内 MDC :comp[text]{props}
			const compName = match[2]!
			const compText = match[3]!
			const rawProps = match[4] || ''
			const parsedProps = parseClientInlineProps(rawProps)
			const Comp = defaultMdxComponents[compName] || defaultMdxComponents[compName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')] || 'span'

			if (typeof Comp === 'function' || typeof Comp === 'object') {
				nodes.push(createElement(Comp, { key, ...parsedProps }, renderInlineMarkdown(compText, `${key}-child`)))
			}
			else {
				nodes.push(createElement('span', { key, className: `mdc-inline-${compName}`, ...parsedProps }, renderInlineMarkdown(compText, `${key}-child`)))
			}
		}
		else if (match[5]) {
			// 2. 行内 MDC 无文案 :comp{props}
			const compName = match[6]!
			const rawProps = match[7] ? match[7].slice(1, -1) : ''
			const parsedProps = parseClientInlineProps(rawProps)
			const Comp = defaultMdxComponents[compName] || defaultMdxComponents[compName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')] || 'span'

			if (typeof Comp === 'function' || typeof Comp === 'object') {
				nodes.push(createElement(Comp, { key, ...parsedProps }))
			}
			else {
				nodes.push(createElement('span', { key, className: `mdc-inline-${compName}`, ...parsedProps }))
			}
		}
		else if (match[8]) {
			// 3. 图片 ![alt](src)
			const alt = match[9] || ''
			const src = match[10] || ''
			const PicComp = defaultMdxComponents.Pic
			if (PicComp) {
				nodes.push(createElement(PicComp, { key, src, alt }))
			}
			else {
				nodes.push(createElement('img', { key, src, alt, style: { maxWidth: '100%', borderRadius: 8 } }))
			}
		}
		else if (match[11]) {
			// 4. 链接 [text](href)
			const linkText = match[12] || ''
			const href = match[13] || ''
			const ProseA = defaultMdxComponents.a || 'a'
			nodes.push(createElement(ProseA, { key, href }, renderInlineMarkdown(linkText, `${key}-text`)))
		}
		else if (match[14]) {
			// 5. 粗体 **bold**
			const boldText = match[15] || match[16] || ''
			nodes.push(createElement('strong', { key }, renderInlineMarkdown(boldText, `${key}-bold`)))
		}
		else if (match[17]) {
			// 6. 斜体 *italic*
			const italicText = match[18] || match[19] || ''
			nodes.push(createElement('em', { key }, renderInlineMarkdown(italicText, `${key}-italic`)))
		}
		else if (match[20]) {
			// 7. 删除线 ~~del~~
			const delText = match[21] || ''
			nodes.push(createElement('del', { key }, renderInlineMarkdown(delText, `${key}-del`)))
		}
		else if (match[22]) {
			// 8. 行内代码 `code`
			const codeText = match[23] || ''
			const ProseCode = defaultMdxComponents.code || 'code'
			nodes.push(createElement(ProseCode, { key }, codeText))
		}

		cursor = matchEnd
		match = inlineRegex.exec(text)
	}

	if (cursor < text.length) {
		nodes.push(text.slice(cursor))
	}

	return nodes
}

interface BlockMdcStackItem {
	colons: string
	componentName: string
	Comp: any
	props: Record<string, any>
	childrenNodes: ReactNode[]
	currentSlotName?: string
	slots: Record<string, ReactNode[]>
}

/**
 * 核心纯前端 0 延迟 Markdown + MDC 宽容解析引擎
 */
export function parseAndRenderClientMdc(
	rawMarkdown: string,
	options: { title?: string, skipFirstH1?: boolean } = {},
): {
	renderedElements: ReactNode
	toc: TocHeading[]
} {
	const slugger = new GithubSlugger()
	const toc: TocHeading[] = []
	let isFirstHeading = true

	// 移除 HTML 注释
	const cleanSource = rawMarkdown.replace(/<!--[\s\S]*?-->/g, '')
	const lines = cleanSource.split('\n')

	const rootNodes: ReactNode[] = []
	const stack: BlockMdcStackItem[] = []

	// 获取当前应该追加子节点的容器
	const appendNode = (node: ReactNode) => {
		if (stack.length > 0) {
			const top = stack[stack.length - 1]!
			if (top.currentSlotName) {
				if (!top.slots[top.currentSlotName]) top.slots[top.currentSlotName] = []
				top.slots[top.currentSlotName]!.push(node)
			}
			else {
				top.childrenNodes.push(node)
			}
		}
		else {
			rootNodes.push(node)
		}
	}

	let i = 0
	let inCodeBlock = false
	let codeBlockLang = ''
	let codeBlockTitle = ''
	let codeBlockLines: string[] = []

	while (i < lines.length) {
		const line = lines[i]!

		// 1. 代码块处理
		if (/^\s*```/.test(line)) {
			if (!inCodeBlock) {
				inCodeBlock = true
				const meta = line.replace(/^\s*```/, '').trim()
				const matchTitle = meta.match(/^([\w-]+)?\s*(?:\[(.*?)\]|title="(.*?)")?/)
				codeBlockLang = matchTitle?.[1] || ''
				codeBlockTitle = matchTitle?.[2] || matchTitle?.[3] || ''
				codeBlockLines = []
				i++
				continue
			}
			else {
				inCodeBlock = false
				const codeContent = codeBlockLines.join('\n')
				const key = `code-${i}`
				const ProsePre = defaultMdxComponents.pre
				if (ProsePre) {
					appendNode(createElement(ProsePre, {
						key,
						className: codeBlockLang ? `language-${codeBlockLang}` : '',
						'data-language': codeBlockLang,
						'data-title': codeBlockTitle,
					}, createElement('code', { className: codeBlockLang ? `language-${codeBlockLang}` : '' }, codeContent)))
				}
				else {
					appendNode(createElement('pre', {
						key,
						className: codeBlockLang ? `language-${codeBlockLang}` : '',
					}, codeBlockTitle ? createElement('div', { className: 'code-title' }, codeBlockTitle) : null, createElement('code', null, codeContent)))
				}
				i++
				continue
			}
		}

		if (inCodeBlock) {
			codeBlockLines.push(line)
			i++
			continue
		}

		// 2. MDC 块闭合检测 ::: 或 ::
		const endMatch = line.match(/^\s*(:{2,4})\s*$/)
		if (endMatch && stack.length > 0) {
			const top = stack[stack.length - 1]!
			if (top.colons.length <= endMatch[1]!.length) {
				stack.pop()
				const key = `mdc-block-${i}`
				const Comp = top.Comp
				// 组合 slots
				let children: ReactNode = top.childrenNodes
				if (Object.keys(top.slots).length > 0) {
					const slotElements = Object.entries(top.slots).map(([slotName, nodes], sIdx) =>
						createElement('div', { key: `slot-${slotName}-${sIdx}`, className: `slot-${slotName}`, 'data-slot': slotName }, nodes),
					)
					children = [...top.childrenNodes, ...slotElements]
				}

				const el = typeof Comp === 'function' || typeof Comp === 'object'
					? createElement(Comp, { key, ...top.props }, children)
					: createElement('div', { key, className: `mdc-container-${top.componentName}`, ...top.props }, children)

				appendNode(el)
				i++
				continue
			}
		}

		// 3. MDC 插槽 #slotname
		const slotMatch = line.match(/^\s*#([\w-]+)\s*$/)
		if (slotMatch && stack.length > 0) {
			const top = stack[stack.length - 1]!
			top.currentSlotName = slotMatch[1]!
			if (!top.slots[top.currentSlotName]) {
				top.slots[top.currentSlotName] = []
			}
			i++
			continue
		}

		// 4. MDC 块开始 ::alert{type="info"} 或 ::link-banner
		const blockMatch = line.match(/^\s*(:{2,4})([a-z][\w-]*)(\{[^}\n]*\})?/i)
		if (blockMatch) {
			const colons = blockMatch[1]!
			const name = blockMatch[2]!
			const inlineProps = blockMatch[3] ? parseClientInlineProps(blockMatch[3].slice(1, -1)) : {}
			const pascalName = name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
			const Comp = defaultMdxComponents[name] || defaultMdxComponents[pascalName] || 'div'

			// 检查紧随其后的 YAML 属性块
			let nextIdx = i + 1
			while (nextIdx < lines.length && lines[nextIdx]!.trim() === '') nextIdx++

			if (nextIdx < lines.length && lines[nextIdx]!.trim() === '---') {
				let yamlEnd = nextIdx + 1
				let yamlContent = ''
				while (yamlEnd < lines.length && lines[yamlEnd]!.trim() !== '---') {
					yamlContent += `${lines[yamlEnd]}\n`
					yamlEnd++
				}
				if (yamlEnd < lines.length && lines[yamlEnd]!.trim() === '---') {
					const yamlProps = parseClientYamlProps(yamlContent)
					const mergedProps = { ...inlineProps, ...yamlProps }

					let afterYaml = yamlEnd + 1
					while (afterYaml < lines.length && lines[afterYaml]!.trim() === '') afterYaml++

					// 自闭合 YAML MDC 块
					if (afterYaml < lines.length && lines[afterYaml]!.trim() === colons) {
						const key = `mdc-self-${i}`
						const el = typeof Comp === 'function' || typeof Comp === 'object'
							? createElement(Comp, { key, ...mergedProps })
							: createElement('div', { key, className: `mdc-container-${name}`, ...mergedProps })
						appendNode(el)
						i = afterYaml + 1
						continue
					}
					else {
						stack.push({
							colons,
							componentName: name,
							Comp,
							props: mergedProps,
							childrenNodes: [],
							slots: {},
						})
						i = yamlEnd + 1
						continue
					}
				}
			}

			// 普通容器 MDC 块
			stack.push({
				colons,
				componentName: name,
				Comp,
				props: inlineProps,
				childrenNodes: [],
				slots: {},
			})
			i++
			continue
		}

		// 5. 标题 # H1 - ###### H6
		const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
		if (headingMatch) {
			const depth = headingMatch[1]!.length
			const headingText = headingMatch[2]!.trim()
			const id = slugger.slug(headingText)

			if (isFirstHeading) {
				isFirstHeading = false
				if (depth === 1 && (options.skipFirstH1 || (options.title && headingText === options.title.trim()))) {
					i++
					continue
				}
			}

			toc.push({ depth, text: headingText, id })
			const key = `h-${depth}-${i}`
			const tagName = `h${depth}`
			appendNode(createElement(tagName, { key, id, className: `heading-${depth}` }, renderInlineMarkdown(headingText, `${key}-inline`)))
			i++
			continue
		}

		// 6. 分割线 ---, ***, ___
		if (/^[*\-_\s]{3,}$/.test(line)) {
			appendNode(createElement('hr', { key: `hr-${i}`, className: 'article-hr' }))
			i++
			continue
		}

		// 7. 引用块 > quote
		if (/^\s*>/.test(line)) {
			const quoteLines: string[] = []
			while (i < lines.length && /^\s*>/.test(lines[i]!)) {
				const m = lines[i]!.match(/^\s*>\s*(.*)$/)
				quoteLines.push(m?.[1] || '')
				i++
			}
			const quoteContent = quoteLines.join(' ')
			appendNode(createElement('blockquote', { key: `quote-${i}`, className: 'article-quote' }, renderInlineMarkdown(quoteContent, `quote-text-${i}`)))
			continue
		}

		// 8. 无序列表 - / * / +
		if (/^\s*[-*+]\s+/.test(line)) {
			const listItems: string[] = []
			while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i]!)) {
				const m = lines[i]!.match(/^\s*[-*+]\s+(.*)$/)
				listItems.push(m?.[1] || '')
				i++
			}
			appendNode(createElement('ul', { key: `ul-${i}`, className: 'article-ul' }, listItems.map((item, lIdx) => createElement('li', { key: `li-${lIdx}` }, renderInlineMarkdown(item, `li-${lIdx}-inline`)))))
			continue
		}

		// 9. 有序列表 1. 2. 3.
		if (/^\s*\d+\.\s+/.test(line)) {
			const listItems: string[] = []
			while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i]!)) {
				const m = lines[i]!.match(/^\s*\d+\.\s+(.*)$/)
				listItems.push(m?.[1] || '')
				i++
			}
			appendNode(createElement('ol', { key: `ol-${i}`, className: 'article-ol' }, listItems.map((item, lIdx) => createElement('li', { key: `ol-li-${lIdx}` }, renderInlineMarkdown(item, `ol-li-${lIdx}-inline`)))))
			continue
		}

		// 10. 表格 | ... |
		if (/^\s*\|.*\|\s*$/.test(line)) {
			const tableLines: string[] = []
			while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i]!)) {
				tableLines.push(lines[i]!.trim())
				i++
			}
			if (tableLines.length >= 2) {
				const headerCells = tableLines[0]!.split('|').slice(1, -1).map(c => c.trim())
				const hasDivider = /^[|:\-\s]+$/.test(tableLines[1]!)
				const bodyLines = hasDivider ? tableLines.slice(2) : tableLines.slice(1)

				const ProseTable = defaultMdxComponents.table || 'table'
				appendNode(createElement(ProseTable, { key: `tbl-${i}`, className: 'article-table' }, createElement('thead', null, createElement('tr', null, headerCells.map((h, hIdx) => createElement('th', { key: `th-${hIdx}` }, renderInlineMarkdown(h, `th-${hIdx}-inline`))))), createElement('tbody', null, bodyLines.map((rowStr, rIdx) => {
					const cells = rowStr.split('|').slice(1, -1).map(c => c.trim())
					return createElement('tr', { key: `tr-${rIdx}` }, cells.map((cell, cIdx) => createElement('td', { key: `td-${cIdx}` }, renderInlineMarkdown(cell, `td-${rIdx}-${cIdx}`))))
				}))))
				continue
			}
		}

		// 11. 空行
		if (line.trim() === '') {
			i++
			continue
		}

		// 12. 普通段落
		appendNode(createElement('p', { key: `p-${i}`, className: 'article-paragraph' }, renderInlineMarkdown(line, `p-${i}-inline`)))
		i++
	}

	// 容错处理：未闭合的 MDC 块全部安全回滚闭合，绝不抛出错误或白屏
	while (stack.length > 0) {
		const top = stack.pop()!
		const key = `mdc-unclosed-${stack.length}`
		const Comp = top.Comp
		let children: ReactNode = top.childrenNodes
		if (Object.keys(top.slots).length > 0) {
			const slotElements = Object.entries(top.slots).map(([slotName, nodes], sIdx) =>
				createElement('div', { key: `slot-${slotName}-${sIdx}`, className: `slot-${slotName}`, 'data-slot': slotName }, nodes),
			)
			children = [...top.childrenNodes, ...slotElements]
		}
		const el = typeof Comp === 'function' || typeof Comp === 'object'
			? createElement(Comp, { key, ...top.props }, children)
			: createElement('div', { key, className: `mdc-container-${top.componentName}`, ...top.props }, children)
		rootNodes.push(el)
	}

	return {
		renderedElements: createElement(React.Fragment, null, rootNodes),
		toc,
	}
}
