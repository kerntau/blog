import { Icon } from '@iconify/react'
import styles from './Empty.module.scss'

export default function Empty({ text }: { text?: string }) {
	return (
		<div className={styles.empty}>
			<Icon icon="tabler:mood-empty" className={styles.icon} />
			<p className={styles.text}>{text || '这里空空如也'}</p>
		</div>
	)
}
