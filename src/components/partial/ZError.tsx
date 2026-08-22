'use client'

import { Icon } from '@iconify/react'
import ProsePre from '../content/ProsePre'
import styles from './ZError.module.scss'
import React from 'react'

export interface ZErrorProps {
	icon?: string
	title?: string
	message?: string
	code?: string
	language?: string
	operation?: React.ReactNode
	children?: React.ReactNode
}

export default function ZError({
	icon = 'line-md:cloud-alt-print-twotone-loop',
	title,
	message,
	code,
	language = 'log',
	operation,
	children
}: ZErrorProps) {
	return (
		<div className={`${styles.error} proper-height`}>
			<div />
			<Icon className={styles.errorIcon} icon={icon} />
			{title && (
				<div 
					className={styles.errorTitle} 
					dangerouslySetInnerHTML={{ __html: title }} 
				/>
			)}

			<div className={styles.operation}>
				{operation}
			</div>

			{code && (
				<ProsePre
					filename={message}
					language={language}
					code={code}
					meta="wrap"
				/>
			)}

			{children}
		</div>
	)
}
