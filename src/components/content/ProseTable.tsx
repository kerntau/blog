import styles from './ProseTable.module.scss'

export default function ProseTable({ children }: { children?: React.ReactNode }) {
	return (
		<div className={styles.tableContainer}>
			<table className={styles.table}>
				{children}
			</table>
		</div>
	)
}
