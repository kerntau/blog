import UtilLink from '../util/UtilLink'
import Pic from './Pic'
import styles from './LinkCard.module.scss'

import { useMemo } from 'react'
import { getDomain } from '../../utils/link'
import { joinWith } from '../../utils/str'

interface LinkCardProps {
	link: string
	title: string
	description?: string
	icon?: string
}

export default function LinkCard({ link, title, description, icon }: LinkCardProps) {
	return (
		<UtilLink
			to={link}
			className={`${styles.linkCard} card`}
			title={joinWith([title, description, link])}
		>
			<div className={styles.info}>
				<div className={styles.title}>{title}</div>
				<div className={styles.description}>{description ?? getDomain(link)}</div>
			</div>
			{icon && <Pic src={icon} className={styles.icon} />}
		</UtilLink>
	)
}
