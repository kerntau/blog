'use client'

import { Icon } from '@iconify/react'
import BlogWidget from '../blog/BlogWidget'
import Tip from '../content/Tip'
import { getOicqGroupAvatar } from '../../utils/img'
import styles from './CommGroup.module.scss'

import appConfig from '../../app.config'

interface CommGroupProps {
	customData?: {
		title?: string
		groupName?: string
		account?: string
		icon?: string
		bgImg?: string
	}
}

export default function CommGroup({ customData }: CommGroupProps = {}) {
	const conf = customData || (appConfig as any).widgets?.commGroup
	const title = conf?.title || '博客/技术社区'
	const groupName = conf?.groupName || '纸网接入点'
	const account = conf?.account || '169994096'
	const icon = conf?.icon || 'ri:qq-fill'
	const bgImg = conf?.bgImg || (/^\d+$/.test(account) ? getOicqGroupAvatar(account) : undefined)

	return (
		<BlogWidget
			card
			dim
			title={title}
			bgImg={bgImg}
			bgRight
			unoptimized
			className={styles.commGroup}
		>
			<div className={`${styles.title} text-creative`}>
				{groupName}
			</div>

			<div className={styles.tip}>
				<Tip copy icon text={account}>
					<Icon icon={icon} />
					{account}
				</Tip>
			</div>
		</BlogWidget>
	)
}
