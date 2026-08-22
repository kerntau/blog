'use client'

import { Icon } from '@iconify/react'
import useCopy from '../../hooks/useCopy'
import ZTooltip from '../partial/ZTooltip'
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

	const inner = (
		<span
			className={styles.tip}
			tabIndex={0}
			onClick={() => isCopyMode && copy()}
			onKeyDown={(e) => {
				if (e.key === 'Enter') {
					isCopyMode && copy()
				}
			}}
		>
			{children || text}
			{typeof icon === 'string' && <Icon icon={icon} className={styles.tipIcon} />}
		</span>
	)

	const tipText = tip || (isCopyMode ? '复制' : '')
	if (tipText) {
		return <ZTooltip content={tipText}>{inner}</ZTooltip>
	}

	return inner
}
