'use client'

import React, { useState } from 'react'
import styles from './Tab.module.scss'

interface TabProps {
	tabs?: string[]
	center?: boolean
	active?: string | number
	children?: React.ReactNode
}

export default function Tab({ tabs, center, active, children }: TabProps) {
	const initialActive = active ? (Number(active) - 1 >= 0 ? Number(active) - 1 : 0) : 0
	const [activeTab, setActiveTab] = useState(initialActive)

	const childrenArray = React.Children.toArray(children)
	const tabList = tabs?.length
		? tabs
		: childrenArray.map((_child, index) => `Tab ${index + 1}`)

	const activeContent = childrenArray.find((child: any) => {
		const targetSlot = `tab${activeTab + 1}`
		if (child.props?.slot === targetSlot) return true
		if (child.props?.['data-slot'] === targetSlot) return true
		if (typeof child.props?.className === 'string' && child.props.className.includes(`slot-${targetSlot}`)) return true
		return false
	}) || childrenArray[activeTab]

	return (
		<div className={`${styles.tabContainer} ${center ? styles.center : ''}`}>
			<div className={styles.tabs}>
				{tabList.map((tab, i) => (
					<button
						key={i}
						type="button"
						className={`${styles.tabButton} ${activeTab === i ? styles.active : ''}`}
						onClick={() => setActiveTab(i)}
					>
						{tab}
					</button>
				))}
			</div>
			<div className={styles.tabContent}>
				{activeContent}
			</div>
		</div>
	)
}
