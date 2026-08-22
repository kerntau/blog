import styles from './loading.module.scss'

export default function Loading() {
	return (
		<div className={styles.loading} aria-label="正在加载">
			<div className={styles.bar} />
			<div className={styles.card}>
				<span />
				<span />
				<span />
			</div>
		</div>
	)
}
