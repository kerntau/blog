import { escape, escapeRegExp } from 'es-toolkit/string'

function toArray<T>(val: T | T[] | undefined): T[] {
	if (val === undefined) return []
	return Array.isArray(val) ? val : [val]
}

// @keep-sorted
const promptLanguageMap: Record<string, string> = {
	'#': 'sh',
	'$': 'sh',
	'CMD': 'bat',
	'PS': 'powershell',
}

export function formatNumber(num?: number) {
	if (typeof num !== 'number')
		return ''
	const intervals = [
		{ label: '万亿', threshold: 1e12 },
		{ label: '亿', threshold: 1e8 },
		{ label: '万', threshold: 1e4 },
	]
	for (const interval of intervals) {
		if (num >= interval.threshold)
			return `${(num / interval.threshold).toFixed(2)}${interval.label}`
	}
	return num.toString()
}

interface FormatBytesOptions {
	decimals?: number
	binary?: boolean
	unitSeparator?: string
}

export function formatBytes(bytes: number, options: FormatBytesOptions = {}) {
	const {
		decimals = 2,
		binary = true,
		unitSeparator = ' ',
	} = options

	if (bytes === 0)
		return `0${unitSeparator}Bytes`

	const base = binary ? 1024 : 1000
	const units = binary
		? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
		: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

	const i = Math.floor(Math.log(bytes) / Math.log(base))
	const value = Number.parseFloat((bytes / base ** i).toFixed(decimals))

	return `${value}${unitSeparator}${units[i]}`
}

export function getPromptLanguage(prompt: string | boolean) {
	if (typeof prompt === 'boolean')
		return 'text'
	for (const promptPrefix in promptLanguageMap) {
		if (prompt.startsWith(promptPrefix))
			return promptLanguageMap[promptPrefix] ?? 'text'
	}
	return 'text'
}

export function highlightHtml(text: string, words: string | string[] | undefined, className?: string) {
	const validTerms = toArray(words)
		.filter((t): t is string => !!t?.trim())
		.map(t => t.toLowerCase())

	const highlightRegex = new RegExp(`(${Array.from(validTerms, escapeRegExp).join('|')})`, 'gi')

	return text
		.split(highlightRegex)
		.map(part => part && validTerms.includes(part.toLowerCase())
			? `<mark${className ? ` class="${className}"` : ''}>${escape(part)}</mark>`
			: escape(part))
		.join('')
		.replace(/\n+/g, '<br>')
}

/** 递归提取 React 节点 / JSX 中的纯文本内容 */
export function extractNodeText(node: any): string {
	if (node === null || node === undefined || typeof node === 'boolean') return ''
	if (typeof node === 'string' || typeof node === 'number') return String(node)
	if (Array.isArray(node)) return node.map(extractNodeText).join('')
	if (node && typeof node === 'object' && 'props' in node && node.props?.children) {
		return extractNodeText(node.props.children)
	}
	return ''
}
