'use client'

import { Icon } from '@iconify/react'
import BlogWidget from '../blog/BlogWidget'
import Tip from '../content/Tip'
import styles from './CommGroup.module.scss'

export default function CommGroup() {
	return (
		<BlogWidget
			card
			dim
			title="博客/技术社区"
			bgImg="https://p.qlogo.cn/gh/169994096/169994096/100/"
			bgRight
			unoptimized
			className={styles.commGroup}
		>
			<div className={`${styles.title} text-creative`}>
				纸网接入点
			</div>

			<div className={styles.tip}>
				<Tip copy icon text="169994096">
					<Icon icon="ri:qq-fill" />
					169994096
				</Tip>
			</div>
		</BlogWidget>
	)
}
