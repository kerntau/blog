'use client'

import React, { useState, useRef } from 'react'
import { Icon } from '@iconify/react'
import useCopy from '../../hooks/useCopy'
import styles from './Copy.module.scss'

interface CopyProps {
	code?: string
	prompt?: string | boolean
	lang?: string
	children?: React.ReactNode
}

export default function Copy({ code: propsCode, prompt = '$', children }: CopyProps) {
	const initialCode = propsCode || (typeof children === 'string' ? children : '')
	const [showUndo, setShowUndo] = useState(false)
	const codeInputRef = useRef<HTMLDivElement>(null)

	const { isCopied, copy } = useCopy(codeInputRef)
	const showPrompt = prompt !== true && prompt !== 'true'

	const handleUndo = () => {
		if (codeInputRef.current) {
			codeInputRef.current.textContent = initialCode
			setShowUndo(false)
		}
	}

	const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
		const current = (e.target as HTMLDivElement).textContent || ''
		setShowUndo(current !== initialCode)
	}

	const handleBeforeInput = (e: any) => {
		if (e.data?.includes('\n') || e.inputType === 'insertLineBreak') {
			e.preventDefault()
		}
	}

	return (
		<code className={styles.copy}>
			{showPrompt && typeof prompt === 'string' && <span className={styles.prompt}>{prompt}</span>}
			<div
				ref={codeInputRef}
				contentEditable="plaintext-only"
				className={`${styles.code} scrollcheck-x`}
				spellCheck={false}
				onBeforeInput={handleBeforeInput}
				onInput={handleInput}
				suppressContentEditableWarning
			>
				{initialCode}
			</div>
			{showUndo && (
				<button type="button" className={styles.operation} aria-label="恢复原始代码" onClick={handleUndo}>
					<Icon icon="tabler:arrow-back-up" />
				</button>
			)}
			<button type="button" className={styles.operation} aria-label="复制" onClick={() => copy()}>
				<Icon icon={isCopied ? 'tabler:check' : 'tabler:copy'} />
			</button>
		</code>
	)
}
