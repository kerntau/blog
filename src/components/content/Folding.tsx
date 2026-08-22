'use client'

import { useState } from 'react'
import { Icon } from '@iconify/react'
import styles from './Folding.module.scss'

interface FoldingProps {
	title?: string
	open?: boolean
	children?: React.ReactNode
}

export default function Folding({ title, open, children }: FoldingProps) {
	const [isOpen, setIsOpen] = useState(open)

	return (
		<details className={styles.folding} open={isOpen} onToggle={(e) => setIsOpen(e.currentTarget.open)}>
			<summary className={styles.foldingTitle}>
				{title}
				<Icon icon="tabler:chevron-right" className={styles.icon} />
			</summary>
			<div className={styles.foldingContent}>
				{children}
			</div>
		</details>
	)
}
