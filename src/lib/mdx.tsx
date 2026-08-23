/* eslint-disable no-new-func */
import { createElement, type ReactNode } from 'react'
import * as runtime from 'react/jsx-runtime'
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

function Slot({ name, children }: { name?: string, children?: ReactNode }) {
	return createElement('div', { slot: name }, children)
}

function FrontmatterData({ yaml }: { yaml?: string }) {
	return createElement('pre', null, createElement('code', null, yaml))
}

function MetaSlot() {
	return null
}

function Div({ children }: { children?: ReactNode }) {
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

function Code(props: any) {
	if (props.className?.includes('language-') || props.className?.includes('shiki') || props['data-language']) {
		return createElement('code', props, props.children)
	}
	return createElement(ProseCode, props, props.children)
}

export const defaultMdxComponents: Record<string, any> = {
	a: ProseA,
	span: Span,
	pre: ProsePre,
	code: Code,
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
}

export function renderCompiledMdx(
	compiledCode?: string,
	fallbackBody = '',
	customComponents: Record<string, any> = {},
): ReactNode {
	if (!compiledCode) {
		return createElement('pre', { className: 'mdx-raw-fallback' }, fallbackBody)
	}

	try {
		const components = { ...defaultMdxComponents, ...customComponents }
		const runner = new Function(
			'runtime',
			'props',
			`
			const { Fragment, jsx, jsxs } = runtime;
			${compiledCode}
			`,
		)
		const exports = runner(runtime, {})
		const Component = exports.default
		return createElement(Component, { components })
	} catch (e) {
		console.error('MDX 渲染失败:', e)
		return createElement('pre', { className: 'mdx-raw-fallback' }, fallbackBody)
	}
}

export function getCompiledMDX(path: string, components?: Record<string, any>) {
	const post = getPostByPath(path)
	if (!post) return null

	const { data, body, toc } = post
	const content = renderCompiledMdx(data.compiledCode, body, components)

	return {
		content,
		frontmatter: data,
		toc: toc || [],
	}
}
