'use client'

import React, { useRef } from 'react'
import { Icon } from '@iconify/react'
import useCopy from '../../hooks/useCopy'
import styles from './ProseCode.module.scss'

interface ProseCodeProps {
	children?: React.ReactNode
	className?: string
	copy?: boolean
}

export default function ProseCode({ children, className, copy }: ProseCodeProps) {
	const codeRef = useRef<HTMLElement>(null)
	const { isCopied, copy: copyCode } = useCopy(codeRef)

	return (
		<code ref={codeRef} className={`${styles.code} ${copy ? styles.copyable : ''} ${className || ''}`}>
			{children}
			{copy && (
				<button type="button" className={styles.copyButton} aria-label="复制" onClick={() => copyCode()}>
					<Icon icon={isCopied ? 'tabler:check' : 'tabler:copy'} />
				</button>
			)}
		</code>
	)
}
