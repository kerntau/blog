import React from 'react'
import { extractNodeText } from '../../utils/str'
import styles from './Chat.module.scss'

interface ChatProps {
	children?: React.ReactNode
}

export default function Chat({ children }: ChatProps) {
	const childrenArray = React.Children.toArray(children)
	const chatRegex = /^\{(?<control>\.|:)?(?<caption>.*)\}$/

	const getControlClass = (control?: string) => {
		if (control === '.') return styles.chatMyself
		if (control === ':') return styles.chatSystem
		return ''
	}

	return (
		<dl className={styles.chat}>
			{childrenArray.map((child, i) => {
				const textContent = extractNodeText(child)

				const match = textContent.trim().match(chatRegex)
				if (match) {
					const { control, caption } = match.groups || {}
					return (
						<dt key={i} className={`${styles.chatCaption} ${getControlClass(control)}`}>
							{caption}
						</dt>
					)
				}
				return <dd key={i} className={styles.chatBody}>{child}</dd>
			})}
		</dl>
	)
}
