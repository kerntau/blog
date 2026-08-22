import type { ElementType } from 'react'
import Image from '@/components/util/Image'
import UtilLink from '../util/UtilLink'
import appConfig from '../../app.config'
import styles from './BlogHeader.module.scss'
import { getFixedDelay } from '../../utils/anim'

interface BlogHeaderProps {
	as?: ElementType
	tag?: ElementType
	to?: string
	suffix?: string
	className?: string
}

export default function BlogHeader({
	as,
	tag,
	to = '/',
	suffix,
	className = '',
}: BlogHeaderProps) {
	const Tag = as || tag || 'div'
	const titleText = suffix ? `${appConfig.title} · ${suffix}` : appConfig.title

	return (
		<UtilLink to={to} className={`${styles.blogHeader} ${className}`.trim()}>
			{appConfig.header.emojiTail && appConfig.header.emojiTail.length > 0 && (
				<div className={styles.emojiTail}>
					{appConfig.header.emojiTail.map((emoji, emojiIndex) => (
						<span
							key={emojiIndex}
							className={styles.splitChar}
							style={getFixedDelay(emojiIndex * 0.6 - 3)}
						>
							{emoji}
						</span>
					))}
				</div>
			)}

			<Image
				src={appConfig.header.logo}
				className={`${styles.blogLogo} round-cobblestone ${appConfig.header.showTitle ? styles.circle : ''}`}
				alt={appConfig.title}
				width={48}
				height={48}
				priority
			/>

			{appConfig.header.showTitle && (
				<div className={styles.blogText}>
					<Tag className={styles.headerTitle}>
						{titleText.split('').map((char, charIndex) => (
							<span
								key={charIndex}
								className={styles.splitChar}
								style={getFixedDelay((charIndex + 1) * 0.1)}
							>
								{char}
							</span>
						))}
					</Tag>

					<div className={styles.headerSubtitle}>
						{appConfig.header.subtitle}
					</div>
				</div>
			)}
		</UtilLink>
	)
}
