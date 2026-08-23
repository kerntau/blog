import React from 'react'
import { extractNodeText } from '../../utils/str'
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
				const textContent = extractNodeText(child)

				const match = textContent.trim().match(timelineRegex)
				if (match) {
					return <dt key={i} className={styles.timelineCaption}>{match.groups?.caption}</dt>
				}
				return <dd key={i} className={`${styles.timelineBody} card`}>{child}</dd>
			})}
		</dl>
	)
}
