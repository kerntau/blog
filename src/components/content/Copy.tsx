'use client'

import { Icon } from '@iconify/react'
import useCopy from '../../hooks/useCopy'
import { getPromptLanguage } from '../../utils/str'
import styles from './Copy.module.scss'

interface CopyProps {
	code: string
	prompt?: string
	lang?: string
}

export default function Copy({ code, prompt = '$' }: CopyProps) {
	const { isCopied, copy } = useCopy(code)
	const showPrompt = prompt !== 'true'
	void getPromptLanguage(prompt)

	return (
		<code className={styles.copy}>
			{showPrompt && <span className={styles.prompt}>{prompt}</span>}
			<span className={`${styles.code} scrollcheck-x`}>{code}</span>
			<button className={styles.operation} aria-label="复制" onClick={() => copy()}>
				<Icon icon={isCopied ? 'tabler:check' : 'tabler:copy'} />
			</button>
		</code>
	)
}
