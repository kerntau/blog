import { Icon } from '@iconify/react'
import styles from './Quote.module.scss'

export default function Quote({ icon, children }: { icon?: string, children?: React.ReactNode }) {
	return (
		<div className={`${styles.quote} title-like`}>
			<div className={styles.iconLine}>
				<Icon icon={icon || 'tabler:message-2'} />
			</div>
			{children}
		</div>
	)
}
