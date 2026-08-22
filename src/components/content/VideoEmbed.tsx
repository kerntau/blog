'use client'

import { useState, useMemo } from 'react'
import { useResizeObserver } from '../../hooks/useResizeObserver'
import styles from './VideoEmbed.module.scss'

interface VideoEmbedProps {
	type?: 'raw' | 'bilibili' | 'bilibili-nano' | 'youtube' | 'douyin' | 'douyin-wide' | 'tiktok'
	id: string
	autoplay?: boolean
	ratio?: string | number
	poster?: string
	width?: string
	height?: string
	zoom?: number
}

const zoomFactorForFixed: Record<string, number> = {
	'douyin': 0.0031,
	'douyin-wide': 0.00134,
}

export default function VideoEmbed(props: VideoEmbedProps) {
	const {
		type = 'raw',
		id,
		autoplay = false,
		poster,
		width,
		height = '80vh',
	} = props

	const [dynamicZoom, setDynamicZoom] = useState<number | undefined>(props.zoom)

	const containerRef = useResizeObserver((entry) => {
		if (type in zoomFactorForFixed) {
			const factor = zoomFactorForFixed[type]
			setDynamicZoom(entry.contentRect.width * factor)
		}
	})

	const ratio = useMemo(() => {
		if (props.ratio) return props.ratio
		switch (type) {
			case 'raw': return undefined
			case 'douyin': return '27 / 56'
			case 'douyin-wide': return '1198 / 731'
			default: return '16 / 9'
		}
	}, [props.ratio, type])

	const src = useMemo(() => {
		switch (type) {
			case 'bilibili':
				return `https://player.bilibili.com/player.html?bvid=${id}&autoplay=${autoplay ? 1 : 0}`
			case 'bilibili-nano':
				return `https://www.bilibili.com/blackboard/newplayer.html?bvid=${id}&autoplay=${autoplay ? 1 : 0}`
			case 'youtube':
				return `https://www.youtube.com/embed/${id}?rel=0&disablekb=1&playsinline=1&autoplay=${autoplay ? 1 : 0}`
			case 'douyin':
			case 'douyin-wide':
				return `https://open.douyin.com/player/video?vid=${id}`
			case 'tiktok':
				return `https://www.tiktok.com/embed/v3/${id}`
			default:
				return id
		}
	}, [type, id, autoplay])

	return (
		<div
			ref={containerRef}
			className={styles.video}
			style={{
				aspectRatio: ratio as any,
				maxWidth: width,
				maxHeight: height,
			}}
		>
			{type === 'raw' ? (
				<video poster={poster} src={src} controls className={styles.media} />
			) : (
				<iframe
					src={src}
					style={{ zoom: dynamicZoom as any }}
					scrolling="no"
					loading="lazy"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture"
					className={styles.media}
				/>
			)}
		</div>
	)
}
