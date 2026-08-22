import type { ReactNode } from 'react'
import { Children, isValidElement } from 'react'
import PicClient from './PicClient'

interface PicProps {
	src?: string
	width?: string | number
	height?: string | number
	alt?: string
	caption?: ReactNode
	filter?: string
	className?: string
	zoom?: boolean
	lightbox?: boolean
	children?: ReactNode
}

function extractText(node: ReactNode): string {
	if (node === null || node === undefined || typeof node === 'boolean') return ''
	if (typeof node === 'string' || typeof node === 'number') return String(node)
	if (Array.isArray(node)) return node.map(extractText).join('')
	if (isValidElement<{ children?: ReactNode }>(node)) return extractText(node.props.children)
	return ''
}

function parseMetaYaml(yaml: string) {
	const meta: Record<string, string> = {}

	for (const line of yaml.split(/\r?\n/)) {
		const match = line.match(/^([\w-]+):\s*(.*)$/)
		if (match) {
			meta[match[1]!] = match[2]!.trim()
		}
	}

	return meta
}

function collectPicData(children: ReactNode) {
	const data: Record<string, string> = {}
	let caption: ReactNode

	function walk(node: ReactNode) {
		Children.toArray(node).forEach((child) => {
			if (!isValidElement<any>(child)) return

			const childProps = child.props as Record<string, any>

			if (typeof childProps.yaml === 'string') {
				Object.assign(data, parseMetaYaml(childProps.yaml))
				return
			}

			if (childProps.slot === 'caption' || childProps.name === 'caption') {
				caption = childProps.children
				return
			}

			const preText = child.type === 'pre' ? extractText(child) : ''
			if (preText.includes('src:')) {
				Object.assign(data, parseMetaYaml(preText))
				return
			}

			if (childProps.children) walk(childProps.children)
		})
	}

	walk(children)
	return { data, caption }
}

function toNumber(value?: string | number) {
	if (typeof value === 'number') return value
	if (!value) return undefined
	const parsed = Number.parseInt(value, 10)
	return Number.isFinite(parsed) ? parsed : undefined
}

export default function Pic(props: PicProps) {
	const { data, caption: slotCaption } = collectPicData(props.children)
	const src = props.src || data.src
	const caption = props.caption || data.caption || slotCaption
	const propCaption = props.caption || data.caption
	const alt = props.alt || data.alt || (typeof propCaption === 'string' ? propCaption : '')

	if (!src) return null

	return (
		<PicClient
			src={src}
			width={toNumber(props.width || data.width)}
			height={toNumber(props.height || data.height)}
			alt={alt}
			caption={caption}
			filter={props.filter || data.filter}
			className={props.className}
			lightbox={props.lightbox ?? props.zoom ?? true}
		/>
	)
}
