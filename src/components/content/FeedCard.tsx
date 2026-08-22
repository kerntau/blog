import { Icon } from '@iconify/react'
import { Temporal } from 'temporal-polyfill'
import type { FeedEntry } from '../../types/feed'
import appConfig from '../../app.config'
import UtilLink from '../util/UtilLink'
import ZTooltip from '../partial/ZTooltip'
import { getArchIcon, getDomainIcon } from '../../utils/icon'
import { getDomain, getDomainType, getMainDomain } from '../../utils/link'
import styles from './FeedCard.module.scss'

export default function FeedCard(props: FeedEntry) {
	const { author, sitenick, title: feedTitle, link, avatar, feed, icon, archs, date, desc, comment, error } = props
	const title = feedTitle ?? sitenick ?? author
	const domainIcon = getDomainIcon(link)
	const domainTip = getDomainType(getMainDomain(link, true))

	let formattedDate = ''
	try {
		if (date) {
			formattedDate = Temporal.PlainDate.from(date).toLocaleString()
		}
	} catch {
		formattedDate = date || ''
	}

	const tooltipContent = (
		<div className={styles.feedCardPopover}>
			<div className={styles.siteContent}>
				{icon ? (
					<img className={styles.siteIcon} src={icon} alt={title || ''} loading="lazy" />
				) : null}
				<div className={styles.siteInfo}>
					<h3 className="text-creative">{title}</h3>
					<code className={styles.domain} title={domainTip}>
						<span>{getDomain(link)}</span>
						{domainIcon && <Icon className={styles.domainMark} icon={domainIcon} />}
					</code>
				</div>
				{archs?.map(arch => {
					const archIcon = getArchIcon(arch as any)
					return archIcon ? (
						<span key={arch} className={styles.arch} title={arch}>
							<Icon icon={archIcon} />
						</span>
					) : null
				})}
			</div>
			<div className={styles.descContent}>
				{formattedDate && <div className={styles.date}>{formattedDate}</div>}
				<p>{error ?? desc}</p>
				{comment && (
					<p>
						<Icon icon="tabler:message-dots" /> {comment}
					</p>
				)}
			</div>
		</div>
	)

	return (
		<ZTooltip
			content={tooltipContent}
			placement="top"
			interactive
			delay={100}
			className={styles.feedTooltip}
		>
			<UtilLink
				to={error ? undefined : link}
				className={`${styles.feedCard} feed-card gradient-card`}
				data-error={error || undefined}
			>
				<div className={`${styles.avatar} avatar`} title={feed ? undefined : '无订阅源'}>
					<img
						className="round-cobblestone"
						src={avatar}
						alt={author}
						loading="lazy"
					/>
					{appConfig.link.remindNoFeed && !feed && (
						<Icon className={styles.noFeed} icon="tabler:bell-off" />
					)}
				</div>

				<span className={styles.author}>{author}</span>
				<span className={styles.sitenick}>{sitenick}</span>
			</UtilLink>
		</ZTooltip>
	)
}
