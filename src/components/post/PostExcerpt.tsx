'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import appConfig from '../../app.config'
import styles from './PostExcerpt.module.scss'

export default function PostExcerpt({ excerpt }: { excerpt: string }) {
	const compConf = appConfig.component.excerpt
	const [text, setText] = useState(compConf.animation ? '' : excerpt)
	const [caret, setCaret] = useState(compConf.animation ? compConf.caret : '')

	useEffect(() => {
		if (compConf.animation) {
			let i = 0
			const timer = setInterval(() => {
				setText(excerpt.slice(0, i + 1))
				i++
				if (i === excerpt.length) {
					clearInterval(timer)
					setCaret('')
				}
			}, 50)
			return () => clearInterval(timer)
		}
	}, [excerpt, compConf.animation, compConf.caret])

	return (
		<div className={`${styles.mdExcerpt} gradient-card`}>
			<span className={styles.dynamic}>
				<Icon icon="tabler:sparkles-2" />
				{text}
				{caret}
			</span>
			<span className={styles.static}>
				<Icon icon="tabler:sparkles-2" />
				{excerpt}
			</span>
		</div>
	)
}
