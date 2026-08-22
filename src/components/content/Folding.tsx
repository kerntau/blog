import styles from './Folding.module.scss'

interface FoldingProps {
	title?: string
	open?: boolean
	children?: React.ReactNode
}

export default function Folding({ title, open, children }: FoldingProps) {
	return (
		<details className={`${styles.folding} folding`} open={open}>
			<summary className={styles.summary}>
				{title}
			</summary>
			{children}
		</details>
	)
}
