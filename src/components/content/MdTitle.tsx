import styles from './MdTitle.module.scss'

export default function MdTitle({ children }: { children: React.ReactNode }) {
	return (
		<div className={styles.mdTitle}>
			{children}
		</div>
	)
}
