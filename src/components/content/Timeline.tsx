import React from 'react'
import styles from './Timeline.module.scss'

interface TimelineProps {
	children?: React.ReactNode
}

export default function Timeline({ children }: TimelineProps) {
	const childrenArray = React.Children.toArray(children)
	
	const timelineRegex = /^\{(?<caption>.*)\}$/

	return (
		<dl className={styles.timeline}>
			{childrenArray.map((child, i) => {
				// 尝试提取文本内容进行匹配
				let textContent = ''
				if (typeof child === 'string') {
					textContent = child
				} else if (React.isValidElement(child)) {
					// 深度遍历寻找第一个文本节点（简化实现）
					const findText = (node: any): string => {
						if (typeof node === 'string') return node
						if (Array.isArray(node)) return node.map(findText).join('')
						if (node.props?.children) return findText(node.props.children)
						return ''
					}
					textContent = findText(child)
				}

				const match = textContent.trim().match(timelineRegex)
				if (match) {
					return <dt key={i} className={styles.timelineCaption}>{match.groups?.caption}</dt>
				}
				return <dd key={i} className={`${styles.timelineBody} gradient-card`}>{child}</dd>
			})}
		</dl>
	)
}
