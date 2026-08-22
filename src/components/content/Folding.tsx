import React from 'react'
import styles from './Folding.module.scss'

interface FoldingProps {
	title?: string
	open?: boolean
	children?: React.ReactNode
}

export default function Folding({ title, open, children }: FoldingProps) {
	const childrenArray = React.Children.toArray(children)
	const titleSlot = childrenArray.find((child: any) =>
		child.props?.slot === 'title'
		|| child.props?.['data-slot'] === 'title'
		|| (typeof child.props?.className === 'string' && child.props.className.includes('slot-title')),
	)
	const restChildren = childrenArray.filter(child => child !== titleSlot)

	return (
		<details className={`${styles.folding} folding`} open={open}>
			<summary className={styles.summary}>
				{titleSlot || title}
			</summary>
			{restChildren}
		</details>
	)
}
