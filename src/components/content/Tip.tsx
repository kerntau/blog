'use client'

import { Icon } from '@iconify/react'
import useCopy from '../../hooks/useCopy'
import styles from './Tip.module.scss'

export default function Tip({
	text,
	tip,
	icon: propsIcon,
	copy: isCopyMode,
	children,
}: any) {
	const content = text || (typeof children === 'string' ? children : '')
	const { isCopied, copy } = useCopy(content)
	
	const icon = propsIcon ?? (isCopied ? 'tabler:check' : isCopyMode && 'tabler:copy')

	return (
		<span
			className={styles.tip}
			tabIndex={0}
			onClick={() => isCopyMode && copy()}
			title={tip}
		>
			{children || text}
			{typeof icon === 'string' && <Icon icon={icon} className={styles.tipIcon} />}
		</span>
	)
}
