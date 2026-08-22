'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Lightbox from '../popover/Lightbox'
import styles from './Pic.module.scss'

interface PicClientProps {
	src: string
	width?: number
	height?: number
	alt?: string
	caption?: ReactNode
	filter?: string
	className?: string
	lightbox?: boolean
}

export default function PicClient({
	src,
	width,
	height,
	alt = '',
	caption,
	filter,
	className = '',
	lightbox = true,
}: PicClientProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [failed, setFailed] = useState(false)
	const loadedRef = useRef(false)
	const hasFixedDimensions = Boolean(width && height)
	const isSvg = /\.svg(?:[?#]|$)/i.test(src)
	const imageStyle = filter ? { filter } : undefined

	useEffect(() => {
		loadedRef.current = false
		setFailed(false)

		const timer = window.setTimeout(() => {
			if (!loadedRef.current) setFailed(true)
		}, 1200)

		return () => window.clearTimeout(timer)
	}, [src])

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
					style={filter ? { filter } : undefined}
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
