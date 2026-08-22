import Image from '@/lib/compat-image'
import { Icon } from '@iconify/react'
import { Temporal } from 'temporal-polyfill'
import type { FeedEntry } from '../../types/feed'
import appConfig from '../../app.config'
import UtilLink from '../util/UtilLink'
import { getArchIcon, getDomainIcon } from '../../utils/icon'
import { getDomain, getDomainType, getMainDomain } from '../../utils/link'
import styles from './FeedCard.module.scss'

export default function FeedCard(props: FeedEntry) {
	const { author, sitenick, title: feedTitle, link, avatar, feed, icon, archs, date, desc, comment, error } = props
	const title = feedTitle ?? sitenick ?? author
	const domainIcon = getDomainIcon(link)
	const domainTip = getDomainType(getMainDomain(link, true))

	return (
		<span className={styles.feedCardWrap}>
			<UtilLink
				to={error ? undefined : link}
				rel="noopener"
				className={`${styles.feedCard} feed-card gradient-card`}
				data-error={error || undefined}
			>
				<div className={`${styles.avatar} avatar`} title={feed ? undefined : '无订阅源'}>
					<Image
						className="round-cobblestone"
						src={avatar}
						alt={author}
						width={40}
						height={40}
						loading="lazy"
						unoptimized
					/>
					{appConfig.link.remindNoFeed && !feed && (
						<Icon className={styles.noFeed} icon="tabler:bell-off" />
					)}
				</div>

				<span className={styles.author}>{author}</span>
				<span className={styles.sitenick}>{sitenick}</span>
			</UtilLink>

			<span className={styles.tooltip} role="tooltip">
				<span className={styles.siteContent}>
					<Image className={styles.siteIcon} src={icon} alt={title} width={24} height={24} unoptimized />
					<span className={styles.siteInfo}>
						<strong className="text-creative">{title}</strong>
						<code className={styles.domain} title={domainTip}>
							<span>{getDomain(link)}</span>
							{domainIcon && <Icon className={styles.domainMark} icon={domainIcon} />}
						</code>
					</span>
					{archs?.map(arch => (
						<span key={arch} className={styles.arch} title={arch}>
							<Icon icon={getArchIcon(arch)} />
						</span>
					))}
				</span>
				<span className={styles.descContent}>
					<span className={styles.date}>{Temporal.PlainDate.from(date).toLocaleString()}</span>
					<span>{error ?? desc}</span>
					{comment && (
						<span>
							<Icon icon="tabler:message-dots" /> {comment}
						</span>
					)}
				</span>
			</span>
		</span>
	)
}
