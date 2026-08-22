'use client'

import React, { useState } from 'react'
import ZButton from '../partial/ZButton'
import ZTooltip from '../partial/ZTooltip'
import styles from './ProseTable.module.scss'

export default function ProseTable({ children }: { children?: React.ReactNode }) {
	const [scroll, setScroll] = useState(true)

	const tooltipContent = (
		<>
			<ZButton
				icon={scroll ? 'tabler:text-wrap' : 'tabler:text-wrap-disabled'}
				text={scroll ? '自动换行' : '横向滚动'}
				onClick={() => setScroll(!scroll)}
			/>
		</>
	)

	return (
		<ZTooltip content={tooltipContent} interactive>
			<figure className={styles.mdTable}>
				<table className={`scrollcheck-x ${scroll ? styles.scroll : ''}`}>
					{children}
				</table>
			</figure>
		</ZTooltip>
	)
}
