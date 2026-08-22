import React from 'react'
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
				let textContent = ''
				if (typeof child === 'string') {
					textContent = child
				} else if (React.isValidElement(child)) {
					const findText = (node: any): string => {
						if (typeof node === 'string') return node
						if (Array.isArray(node)) return node.map(findText).join('')
						if (node.props?.children) return findText(node.props.children)
						return ''
					}
					textContent = findText(child)
				}

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
