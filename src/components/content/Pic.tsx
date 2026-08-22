'use client'

import type { ReactNode } from 'react'
import { Children, isValidElement, useEffect, useRef, useState } from 'react'
import Image from '@/lib/compat-image'
import Lightbox from '../popover/Lightbox'
import { extractNodeText } from '../../utils/str'
import styles from './Pic.module.scss'

export interface PicProps {
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

			const preText = child.type === 'pre' ? extractNodeText(child) : ''
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
	const width = toNumber(props.width || data.width)
	const height = toNumber(props.height || data.height)
	const filter = props.filter || data.filter
	const lightbox = props.lightbox ?? props.zoom ?? true
	const className = props.className || ''

	const [isOpen, setIsOpen] = useState(false)
	const [failed, setFailed] = useState(false)
	const loadedRef = useRef(false)
	const hasFixedDimensions = Boolean(width && height)
	const isSvg = Boolean(src && /\.svg(?:[?#]|$)/i.test(src))
	const imageStyle = filter ? { filter } : undefined

	useEffect(() => {
		loadedRef.current = false
		setFailed(false)

		const timer = window.setTimeout(() => {
			if (!loadedRef.current) setFailed(true)
		}, 1200)

		return () => window.clearTimeout(timer)
	}, [src])

	if (!src) return null

	return (
		<figure className={`${styles.pic} image ${className} ${lightbox ? styles.clickable : ''}`.trim()}>
			{failed ? (
				<img
					src={src}
					alt={alt}
					className={`${styles.fallbackImage} image`}
					onClick={() => lightbox && setIsOpen(true)}
				/>
			) : hasFixedDimensions ? (
				<Image
					src={src}
					alt={alt}
					width={width}
					height={height}
					sizes="(max-width: 768px) 100vw, 768px"
					style={imageStyle}
					className={`${styles.image} image`}
					unoptimized={isSvg}
					onClick={() => lightbox && setIsOpen(true)}
					onLoad={() => {
						loadedRef.current = true
					}}
					onError={() => setFailed(true)}
				/>
			) : (
				<img
					src={src}
					alt={alt}
					width={width}
					height={height}
					srcSet={`${src} 1x, ${src} 1.5x, ${src} 2x`}
					className={`${styles.image} image`}
					style={imageStyle}
					onClick={() => lightbox && setIsOpen(true)}
					onLoad={() => {
						loadedRef.current = true
					}}
					onError={() => setFailed(true)}
				/>
			)}

			{caption && (
				<figcaption className={styles.caption} aria-hidden>
					{caption}
				</figcaption>
			)}

			{lightbox && (
				<Lightbox
					src={src}
					alt={alt}
					open={isOpen}
					onClose={() => setIsOpen(false)}
				/>
			)}
		</figure>
	)
}
