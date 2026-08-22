'use client'

import { useMemo } from 'react'
import UtilLink from '../util/UtilLink'
import ZTooltip from '../partial/ZTooltip'
import Image from '@/components/util/Image'
import { getGithubUsername, isExtLink, getDomain, safelyDecodeUriComponent } from '../../utils/link'
import { getGithubAvatar, getFavicon } from '../../utils/img'
import styles from './Badge.module.scss'

export interface BadgeProps {
	img?: string
	text?: string
	link?: string
	round?: boolean
	square?: boolean
	children?: React.ReactNode
}

export default function Badge({ img, text, link, round, square, children }: BadgeProps) {
	const imgSrc = useMemo(() => {
		if (img) return img
		const ghUsername = getGithubUsername(link)
		if (ghUsername) return getGithubAvatar(ghUsername)
		if (link && isExtLink(link)) return getFavicon(getDomain(link))
		return ''
	}, [img, link])

	const isRound = useMemo(() => {
		return imgSrc ? !square : round
	}, [imgSrc, square, round])

	const tip = useMemo(() => {
		if (!link) return ''
		if (isExtLink(link)) return getDomain(link)
		return safelyDecodeUriComponent(link)
	}, [link])

	const content = (
		<UtilLink
			className={`${styles.badge} ${isRound ? styles.round : ''}`}
			to={link}
		>
			{imgSrc && (
				<Image
					className={styles.badgeIcon}
					src={imgSrc}
					alt=""
					width={22}
					height={22}
				/>
			)}
			<span className={styles.badgeText}>
				{children || text}
			</span>
		</UtilLink>
	)

	if (tip) {
		return (
			<ZTooltip content={tip}>
				{content}
			</ZTooltip>
		)
	}

	return content
}
