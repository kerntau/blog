/**
 * 统一 MDC (Markdown Components) 预编译与语法解析器
 * 提供 Single Source of Truth，供 build-static.ts 和 admin-server.ts 共享
 */

export const MDC_LEAF_COMPONENTS: Record<string, string> = {
	'alert': 'Alert',
	'badge': 'Badge',
	'blog-header': 'BlogHeader',
	'copy': 'Copy',
	'emoji-clock': 'EmojiClock',
	'tip': 'Tip',
	'pic': 'Pic',
	'tab': 'Tab',
	'folding': 'Folding',
	'timeline': 'Timeline',
	'music-score': 'MusicScore',
	'video-embed': 'VideoEmbed',
	'poetry': 'Poetry',
	'link-card': 'LinkCard',
	'link-banner': 'LinkBanner',
	'chat': 'Chat',
	'key': 'Key',
	'quote': 'Quote',
	'card-list': 'CardList',
	'md-title': 'MdTitle',
}

/** 解析 MDC 容器内的 YAML 属性块 */
export function parseYamlProps(yamlStr: string): Record<string, any> {
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
			props[key] = val
		}
	}
	return props
}

/** 将 MDC 属性语法转换为 JSX 属性字符串 */
export function convertMdcPropsToJsx(propsStr: string): string {
	if (!propsStr) return ''
	// 处理 :prop='[...]' 或 :prop="{...}" 或 :prop="true" -> prop={[...]}
	return propsStr.replace(/:([\w-]+)=(['"])(.*?)\2/g, (_m, key, _q, val) => {
		return `${key}={${val}}`
	})
}

/**
 * 核心 MDC 语法转 JSX 预编译器
 * 将 Markdown 中的 MDC 指令（如 ::alert, :tip[xxx]{type="info"} 等）转化为标准 JSX 标签
 */
export function preprocessMdc(source: string): string {
	// 预先清理 HTML 注释，防止 MDX 语法解析器将其误作为非法 JSX 抛出异常
	source = source.replace(/<!--[\s\S]*?-->/g, '')

	let inCodeBlock = false
	const lines = source.split('\n')
	const result: string[] = []
	const blockStack: Array<{ colons: string, component: string, currentSlot?: string }> = []

	for (let i = 0; i < lines.length; i++) {
		let line = lines[i]!

		if (/^\s*```/.test(line)) {
			inCodeBlock = !inCodeBlock
			result.push(line)
			continue
		}

		if (inCodeBlock) {
			result.push(line)
			continue
		}

		// 检查组件内的 YAML frontmatter 块 e.g. ::link-banner \n --- \n ... \n --- \n ::
		const blockMatch = line.match(/^\s*(:{2,4})([a-z][\w-]*)(\{[^}\n]*\})?/i)
		if (blockMatch) {
			const colons = blockMatch[1]!
			const name = blockMatch[2]!
			const component = MDC_LEAF_COMPONENTS[name] || name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
			const inlineProps = blockMatch[3] ? convertMdcPropsToJsx(blockMatch[3].slice(1, -1).trim()) : ''

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
					const parsed = parseYamlProps(yamlContent)
					const propStrings = Object.entries(parsed).map(([k, v]) => {
						if (v === 'true' || v === 'false' || (!Number.isNaN(Number(v)) && v !== '')) {
							return `${k}={${v}}`
						}
						return `${k}=${JSON.stringify(v)}`
					})
					const allProps = [inlineProps, ...propStrings].filter(Boolean).join(' ')

					let afterYaml = yamlEnd + 1
					while (afterYaml < lines.length && lines[afterYaml]!.trim() === '') afterYaml++
					if (afterYaml < lines.length && lines[afterYaml]!.trim() === colons) {
						result.push(`<${component}${allProps ? ` ${allProps}` : ''} />`)
						i = afterYaml
						continue
					}
					else {
						result.push(`<${component}${allProps ? ` ${allProps}` : ''}>`)
						blockStack.push({ colons, component })
						i = yamlEnd
						continue
					}
				}
			}

			blockStack.push({ colons, component })
			result.push(`<${component}${inlineProps ? ` ${inlineProps}` : ''}>`)
			continue
		}

		// 检查闭合标签 e.g. ::: 或 ::
		const endMatch = line.match(/^\s*(:{2,4})\s*$/)
		if (endMatch && blockStack.length > 0) {
			const top = blockStack[blockStack.length - 1]!
			if (top.colons.length <= endMatch[1]!.length) {
				if (top.currentSlot) {
					result.push(`</div>`)
				}
				blockStack.pop()
				result.push(`</${top.component}>`)
				continue
			}
		}

		// 处理 MDC 命名插槽 #slotname (如 #title, #default, #tab1, #tab2)
		const slotMatch = line.match(/^\s*#([\w-]+)\s*$/)
		if (slotMatch && blockStack.length > 0) {
			const top = blockStack[blockStack.length - 1]!
			const slotName = slotMatch[1]!
			if (top.currentSlot) {
				result.push(`</div>`)
			}
			top.currentSlot = slotName
			result.push(`<div className="slot-${slotName}" data-slot="${slotName}">`)
			continue
		}

		// 处理代码块首行标题语法 e.g. ```sh [可疑命令] -> ```sh title="可疑命令"
		line = line.replace(/^(\s*```[\w-]+)\s+\[(.*?)\]/, '$1 title="$2"')

		// 处理行内代码块 MDC 属性语法 e.g. `code`{lang="sh"} -> `code`
		line = line.replace(/(`[^`\n]+`)\{[^}\n]*\}/g, '$1')

		// 处理行内带文本组件 :tip[文本]{tip="..."} 或 :quote[文本]
		line = line.replace(/(^|[^\w/]):([a-z][\w-]*)\[(.*?)\](?:\{((?:[^{}]|"[^"]*"|'[^']*')*)\})?/g, (_m, prefix, name, text, attrs) => {
			const comp = MDC_LEAF_COMPONENTS[name] || name.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join('')
			const props = attrs ? convertMdcPropsToJsx(attrs.trim()) : ''
			return `${prefix}<${comp}${props ? ` ${props}` : ''}>${text}</${comp}>`
		})

		// 处理行内无文本组件 :badge{type="warning" text="草稿"}
		line = line.replace(/(^|[^\w/]):([a-z][\w-]*)(\{[^}\n]*\})/g, (_m, prefix, name, attrs) => {
			const comp = MDC_LEAF_COMPONENTS[name] || name.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join('')
			const props = convertMdcPropsToJsx(attrs.slice(1, -1).trim())
			return `${prefix}<${comp}${props ? ` ${props}` : ''} />`
		})

		// 转换自动链接 <http://...> 为 [http://...](http://...)，兼容 MDX JSX 解析
		line = line.replace(/<(https?:\/\/[^>]+)>/g, (_m, url) => `[${url}](${url})`)
		line = line.replace(/<br\s*>/gi, '<br />').replace(/<hr\s*>/gi, '<hr />')

		if (!line.startsWith('<') && !line.startsWith('`')) {
			line = line
				.split(/(`[^`\n]*`)/g)
				.map((part, index) => {
					if (index % 2 === 1) return part
					return part
						.replace(/\{/g, '&#123;')
						.replace(/\}/g, '&#125;')
						.replace(/<(?!\/?(?:Alert|Badge|BlogHeader|Copy|EmojiClock|Tip|Pic|Tab|Folding|Timeline|MusicScore|VideoEmbed|Poetry|LinkCard|LinkBanner|Chat|Key|Quote|CardList|MdTitle|a|p|div|span|strong|em|code|pre|blockquote|ul|ol|li|table|thead|tbody|tr|th|td|hr|br|img|h1|h2|h3|h4|h5|h6)\b)/gi, '&lt;')
				})
				.join('')
		}

		result.push(line)
	}

	while (blockStack.length > 0) {
		const top = blockStack.pop()!
		if (top.currentSlot) {
			result.push(`</div>`)
		}
		result.push(`</${top.component}>`)
	}

	return result.join('\n')
}
