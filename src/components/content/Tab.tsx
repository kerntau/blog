'use client'

import React, { useState } from 'react'
import styles from './Tab.module.scss'

interface TabProps {
	tabs?: string[]
	center?: boolean
	children?: React.ReactNode
}

export default function Tab({ tabs, center, children }: TabProps) {
	const [activeTab, setActiveTab] = useState(0)

	// 在 React 中模拟 Vue 的具名插槽
	// 我们约定 children 中的元素如果有 slot 属性，则对应到相应的 tab
	const childrenArray = React.Children.toArray(children)
	const tabList = tabs?.length
		? tabs
		: childrenArray
			.filter((child: any) => child.props?.slot?.startsWith('tab'))
			.map((_child, index) => `Tab ${index + 1}`)
	
	const activeContent = childrenArray.find((child: any) => 
		child.props?.slot === `tab${activeTab + 1}`
	) || childrenArray[activeTab]

	return (
		<div className={`${styles.tabContainer} ${center ? styles.center : ''}`}>
			<div className={styles.tabs}>
				{tabList.map((tab, i) => (
					<button
						key={i}
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
