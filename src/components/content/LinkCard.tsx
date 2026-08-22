import UtilLink from '../util/UtilLink'
import Pic from './Pic'
import styles from './LinkCard.module.scss'

import { useMemo } from 'react'

interface LinkCardProps {
	link: string
	title: string
	description?: string
	icon?: string
}

export default function LinkCard({ link, title, description, icon }: LinkCardProps) {
	const domain = useMemo(() => {
		try {
			return new URL(link).hostname
		} catch {
			return link
		}
	}, [link])

	return (
		<UtilLink to={link} className={`${styles.linkCard} gradient-card`}>
			<div className={styles.info}>
				<div className={styles.title}>{title}</div>
				<div className={styles.description}>{description ?? domain}</div>
			</div>
			{icon && <Pic src={icon} className={styles.icon} />}
		</UtilLink>
	)
}
