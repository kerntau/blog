import styles from './ZSecret.module.scss'

export default function ZSecret({ children }: { children: React.ReactNode }) {
	return (
		<div className={[styles.secretContainer, 'secret-container'].filter(Boolean).join(' ')}>
			<div className={styles.secret}>
				{children}
			</div>
		</div>
	)
}
