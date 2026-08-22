import Image from '@/lib/compat-image'
import UtilLink from '../util/UtilLink'
import appConfig from '../../app.config'
import styles from './BlogHeader.module.scss'
import { getFixedDelay } from '../../utils/anim'

interface BlogHeaderProps {
	as?: React.ElementType
	tag?: React.ElementType
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
			<div className={styles.avatarWrapper}>
				{appConfig.header.emojiTail && appConfig.header.emojiTail.length > 0 && (
					<div className={styles.emojiTail}>
						{appConfig.header.emojiTail.map((emoji, idx) => (
							<span
								key={idx}
								className={styles.splitChar}
								style={{
									...getFixedDelay(idx * 0.6 - 3),
									'--idx': idx,
								} as React.CSSProperties}
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
			</div>

			{appConfig.header.showTitle && (
				<div className={styles.blogText}>
					<Tag className={styles.headerTitle}>
						{titleText.split('').map((char, idx) => (
							<span key={idx} className={styles.splitChar} style={getFixedDelay((idx + 1) * 0.1)}>
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
