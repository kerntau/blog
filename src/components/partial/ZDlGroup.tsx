import React from 'react'
import styles from './ZDlGroup.module.scss'

interface DlItem {
	label: string
	value: React.ReactNode | (() => React.ReactNode)
	tip?: string
}

interface ZDlGroupProps {
	items: DlItem[]
	size?: 'small' | 'medium' | 'large'
}

export default function ZDlGroup({ items, size = 'medium' }: ZDlGroupProps) {
	return (
		<dl className={`${styles.dlGroup} dl-group ${styles[size] ?? ''} ${size}`.trim()}>
			{items.map((item, i) => (
				<div key={item.label || i} className={styles.item}>
					<dt className={styles.dt}>{item.label}</dt>
					<dd className={styles.dd} title={item.tip}>
						{typeof item.value === 'function' ? item.value() : item.value}
					</dd>
				</div>
			))}
		</dl>
	)
}
