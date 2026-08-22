import React from 'react'
import styles from './ZDlGroup.module.scss'

export interface DlItem {
	label: React.ReactNode
	value: React.ReactNode | (() => React.ReactNode)
	tip?: string
}

interface ZDlGroupProps {
	items: DlItem[]
	size?: 'small' | 'medium' | 'large'
	className?: string
}

export default function ZDlGroup({ items, size = 'medium', className = '' }: ZDlGroupProps) {
	return (
		<dl className={`${styles.dlGroup} dl-group ${styles[size] ?? ''} ${size} ${className}`.trim()}>
			{items.map((item, i) => (
				<div key={i} className={styles.item}>
					<dt className={styles.dt}>{typeof item.label === 'function' ? (item.label as any)() : item.label}</dt>
					<dd className={styles.dd} title={item.tip}>
						{typeof item.value === 'function' ? item.value() : item.value}
					</dd>
				</div>
			))}
		</dl>
	)
}
