'use client'

import { Icon } from '@iconify/react'
import appConfig from '../../app.config'
import styles from './Alert.module.scss'

const typeMap = {
	tip: {
		icon: 'tabler:note',
		color: '#3A7',
		title: '提醒',
	},
	info: {
		icon: 'tabler:info-circle',
		color: 'var(--c-text-1)',
		title: '信息',
	},
	question: {
		icon: 'tabler:help-circle',
		color: '#3AF',
		title: '问题',
	},
	warning: {
		icon: 'tabler:alert-triangle',
		color: '#F80',
		title: '警告',
	},
	error: {
		icon: 'tabler:circle-x',
		color: '#F33',
		title: '错误',
	},
}

interface AlertProps {
	type?: keyof typeof typeMap
	card?: boolean
	flat?: boolean
	icon?: string
	color?: string
	title?: React.ReactNode
	text?: string
	children?: React.ReactNode
}

export default function Alert({
	type = 'tip',
	card: propsCard,
	flat,
	icon: propsIcon,
	color: propsColor,
	title: propsTitle,
	text,
	children,
}: AlertProps) {
	const card = appConfig.component.alert.defaultStyle === 'flat' ? propsCard : !flat
	const config = typeMap[type] || typeMap.tip
	
	const icon = propsIcon || config.icon
	const color = propsColor || config.color
	const title = propsTitle || config.title

	return (
		<div className={`${styles.alert} ${card ? styles.card : ''}`} style={{ '--c-primary': color } as any}>
			<div className={styles.alertTitle}>
				<Icon icon={icon} />
				<div>{title}</div>
			</div>
			{children || (text && <p>{text}</p>)}
		</div>
	)
}
