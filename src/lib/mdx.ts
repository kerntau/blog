import { compileMDX } from 'next-mdx-remote/rsc'
import { createElement } from 'react'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import rehypeShiki from '@shikijs/rehype'
import { transformerNotationDiff, transformerNotationHighlight } from '@shikijs/transformers'
import { visit } from 'unist-util-visit'
import GithubSlugger from 'github-slugger'
import remarkMusic from '../../remark-plugins/remark-music'
import rehypeMetaSlots from '../../remark-plugins/rehype-meta-slots'
import { getPostByPath } from './content'

import ProseA from '../components/content/ProseA'
import ProsePre from '../components/content/ProsePre'
import ProseCode from '../components/content/ProseCode'
import ProseTable from '../components/content/ProseTable'
import Alert from '../components/content/Alert'
import Badge from '../components/content/Badge'
import Blur from '../components/content/Blur'
import MdTitle from '../components/content/MdTitle'
import Poetry from '../components/content/Poetry'
import Tip from '../components/content/Tip'
import Pic from '../components/content/Pic'
import Tab from '../components/content/Tab'
import Copy from '../components/content/Copy'
import Folding from '../components/content/Folding'
import Timeline from '../components/content/Timeline'
import MusicScore from '../components/content/MusicScore'
import LinkCard from '../components/content/LinkCard'
import LinkBanner from '../components/content/LinkBanner'
import VideoEmbed from '../components/content/VideoEmbed'
import EmojiClock from '../components/content/EmojiClock'
import Chat from '../components/content/Chat'
import Key from '../components/content/Key'
import Quote from '../components/content/Quote'
import CardList from '../components/content/CardList'
import BlogHeader from '../components/blog/BlogHeader'

function rehypeHeadingAnchors() {
	return (tree: any) => {
		visit(tree, 'element', (node: any) => {
			if (!/^h[1-6]$/.test(node.tagName)) return
			const id = node.properties?.id
			if (!id) return
			if (node.children?.[0]?.type === 'element' && node.children[0].tagName === 'a') return

			node.children = [{
				type: 'element',
				tagName: 'a',
				properties: { href: `#${id}` },
				children: node.children || [],
			}]
		})
	}
}

const mdcLeafComponents: Record<string, string> = {
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

function preprocessMdc(source: string) {
	let inCodeBlock = false
	let inTemplateProp = false
	const blockStack: string[] = []

	return source
		.replace(/<!--[\s\S]*?-->/g, '')
		.split('\n')
		.map((line) => {
			if (/^\s*```/.test(line)) {
				inCodeBlock = !inCodeBlock
				return line
			}
			if (inCodeBlock) {
				return line
			}
			if (line.includes('={`')) {
				inTemplateProp = true
			}
			if (inTemplateProp) {
				if (line.includes('`}')) {
					inTemplateProp = false
				}
				return line
			}

			const processedLine = line
				.replace(/(`[^`\n]*`|\[[^\]\n]*\]\([^)\n]*\)|\[[^\]\n]*\])\{[^}\n]*\}/g, '$1')
				.replace(/\s:([A-Za-z_$][\w$-]*)=(['"])(.*?)\2/g, (_full, prop: string, _quote: string, value: string) => ` ${prop}={${value}}`)
				.replace(/\sstyle=(['"])(.*?)\1/g, (_full, _quote: string, value: string) => {
					const styleObject = parseStyle(value) as Record<string, string>
					return ` style={${JSON.stringify(styleObject)}}`
				})

			// Handle ::block end
			if (/^\s*::\s*$/.test(processedLine) && blockStack.length > 0) {
				const component = blockStack.pop()
				return `</${component}>`
			}

			// Handle ::block start
			const blockMatch = processedLine.match(/^\s*::([a-z][\w-]*)(\{[^}\n]*\})?/i)
			if (blockMatch) {
				const name = blockMatch[1]!
				const component = mdcLeafComponents[name] || name.charAt(0).toUpperCase() + name.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
				const props = blockMatch[2] ? blockMatch[2].slice(1, -1).trim() : ''
				blockStack.push(component)
				return `<${component}${props ? ` ${props}` : ''}>`
			}

			// Handle :inline and :leaf
			const expandedDirectives = processedLine.replace(/(^|[^\w/]):([a-z][\w-]*)(\{[^}\n]*\})?/g, (full, prefix: string, name: string, attrs = '') => {
				const component = mdcLeafComponents[name]
				if (!component) {
					return full
				}
				const props = attrs ? attrs.slice(1, -1).trim() : ''
				return `${prefix}<${component}${props ? ` ${props}` : ''} />`
			})

			if (/<\/?[A-Z]/.test(expandedDirectives)) {
				return expandedDirectives
			}

			return expandedDirectives
				.split(/(`[^`\n]*`)/g)
				.map((part, index) => index % 2 === 1 ? part : part.replace(/[{}]/g, brace => `\\${brace}`))
				.join('')
		})
		.join('\n')
}

function Slot({ name, children }: { name?: string, children?: React.ReactNode }) {
	return createElement('div', { slot: name }, children)
}

function FrontmatterData({ yaml }: { yaml?: string }) {
	return createElement('pre', null, createElement('code', null, yaml))
}

function MetaSlot() {
	return null
}

function Div({ children }: { children?: React.ReactNode }) {
	return createElement('div', null, children)
}

function parseStyle(style?: string | Record<string, string>) {
	if (!style || typeof style !== 'string') {
		return style
	}
	return Object.fromEntries(style
		.split(';')
		.map(rule => rule.trim())
		.filter(Boolean)
		.map((rule) => {
			const [key, ...value] = rule.split(':')
			return [
				key!.trim().replace(/-([a-z])/g, (_, char: string) => char.toUpperCase()),
				value.join(':').trim(),
			]
		}))
}

function Span(props: any) {
	return createElement('span', { ...props, style: parseStyle(props.style) }, props.children)
}

export async function getCompiledMDX(path: string, components?: Record<string, React.ComponentType<any>>) {
	const post = getPostByPath(path)
	if (!post) return null

	const { data, body } = post
	const source = preprocessMdc(body)
	const toc: any[] = []
	const slugger = new GithubSlugger()

	let content
	try {
		;({ content } = await compileMDX({
			source,
			options: {
				parseFrontmatter: false,
				mdxOptions: {
					remarkPlugins: [
						remarkMath,
						remarkMusic,
						() => (tree) => {
							visit(tree, 'heading', (node: any) => {
								const text = node.children
									.map((c: any) => c.value || '')
									.join('')
								const id = slugger.slug(text)
								node.data = node.data || {}
								node.data.hProperties = node.data.hProperties || {}
								node.data.hProperties.id = id
								toc.push({
									depth: node.depth,
									text,
									id,
								})
							})
						},
					],
					rehypePlugins: [
						rehypeKatex,
						rehypeMetaSlots,
						rehypeHeadingAnchors,
						[rehypeShiki as any, {
							themes: {
								light: 'github-light',
								dark: 'github-dark',
							},
							transformers: [
								transformerNotationDiff(),
								transformerNotationHighlight(),
							],
						}],
					],
				},
			},
			components: {
				a: ProseA,
				span: Span,
				pre: ProsePre,
				code: ProseCode,
				table: ProseTable,
				Alert,
				Badge,
				Blur,
				MdTitle,
				Poetry,
				Tip,
				Pic,
				Tab,
				Copy,
				Folding,
				Timeline,
				'music-score': MusicScore,
				LinkCard,
				LinkBanner,
				VideoEmbed,
				EmojiClock,
				Chat,
				Key,
				Quote,
				CardList,
				BlogHeader,
				Slot,
				FrontmatterData,
				MetaAsideBar: MetaSlot,
				MetaAsideFoo: MetaSlot,
				MetaAsideGithub: MetaSlot,
				MetaCopyright: MetaSlot,
				Div,
				...components,
			},
		}))
	} catch {
		content = createElement('pre', { className: 'mdx-raw-fallback' }, body)
	}

	return {
		content,
		frontmatter: data,
		toc,
	}
}
