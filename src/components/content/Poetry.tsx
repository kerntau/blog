import styles from './Poetry.module.scss'

export default function Poetry({ children }: { children: React.ReactNode }) {
	return (
		<div className={styles.poetry}>
			{children}
		</div>
	)
}
