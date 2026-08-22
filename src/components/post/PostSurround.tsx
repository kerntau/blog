import React from 'react'
import { Icon } from '@iconify/react'
import type { ParsedPost } from '../../lib/content'
import UtilLink from '../util/UtilLink'
import UtilDate from '../util/UtilDate'
import { getPostTypeClassName } from '../../utils/article'
import styles from './PostSurround.module.scss'

interface PostSurroundProps {
	prev?: ParsedPost | null
	next?: ParsedPost | null
}

export default function PostSurround({ prev, next }: PostSurroundProps) {
	if (!prev && !next) return null

	return (
		<div className={styles.surroundPost} dir="ltr">
			<SurroundLink
				post={next}
				icon="zi:solar-rewind-back-bold-duotone"
				fallbackIcon="line-md:coffee-twotone-loop"
				fallbackText="新故事即将发生"
			/>
			<SurroundLink
				post={prev}
				icon="zi:solar-rewind-forward-bold-duotone"
				fallbackIcon="line-md:construction-twotone"
				fallbackText="已抵达博客尽头"
				alignEnd
			/>
		</div>
	)
}

function SurroundLink({
	post,
	icon,
	fallbackIcon,
	fallbackText,
	alignEnd,
}: {
	post?: ParsedPost | null
	icon: string
	fallbackIcon: string
	fallbackText: string
	alignEnd?: boolean
}) {
	const iconClassName = `${styles.iconify} ${post ? 'rtl-flip' : ''}`

	return (
		<UtilLink
			to={post?.path}
			className={`${styles.surroundLink} ${alignEnd ? styles.alignEnd : ''}`}
			{...(alignEnd ? ({ 'align-end': '' } as Record<string, string>) : {})}
		>
			{post && icon === 'zi:solar-rewind-back-bold-duotone' ? (
				<SolarRewindBackIcon className={iconClassName} />
			) : post && icon === 'zi:solar-rewind-forward-bold-duotone' ? (
				<SolarRewindForwardIcon className={iconClassName} />
			) : (
				<Icon className={iconClassName} icon={post ? icon : fallbackIcon} />
			)}
			<div className={styles.surroundText}>
				<strong className={`${styles.title} ${getPostTypeClassName(post?.type)}`}>
					{post?.title || fallbackText}
				</strong>
				{post?.date && <UtilDate className={styles.date} date={post.date} />}
			</div>
		</UtilLink>
	)
}

function SolarRewindBackIcon({ className }: { className?: string }) {
	return (
		<svg className={className} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
			<path fill="currentColor" fillRule="evenodd" d="M22 6.426v11.148c0 1.847-1.6 3.015-2.903 2.118L13 15.232V8.768l6.097-4.46C20.399 3.411 22 4.58 22 6.426" clipRule="evenodd" opacity=".5" />
			<path fill="currentColor" d="M13 7.123v9.754c0 1.616-1.467 2.638-2.661 1.853L2.92 13.853c-1.228-.807-1.228-2.899 0-3.706l7.42-4.877c1.193-.785 2.66.237 2.66 1.853" />
		</svg>
	)
}

function SolarRewindForwardIcon({ className }: { className?: string }) {
	return (
		<svg className={className} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
			<path fill="currentColor" fillRule="evenodd" d="M2 6.426v11.148c0 1.847 1.6 3.015 2.903 2.118L11 15.232V8.768l-6.097-4.46C3.601 3.411 2 4.58 2 6.426" clipRule="evenodd" opacity=".5" />
			<path fill="currentColor" d="M11 7.123v9.754c0 1.616 1.467 2.638 2.661 1.853l7.418-4.877c1.228-.807 1.228-2.899 0-3.706L13.66 5.27C12.467 4.485 11 5.507 11 7.123" />
		</svg>
	)
}
