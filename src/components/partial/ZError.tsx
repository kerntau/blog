import { Icon } from '@iconify/react'
import ZButton from './ZButton'
import styles from './ZError.module.scss'

interface ZErrorProps {
	icon?: string
	title?: string
	text?: string
}

export default function ZError({ icon, title, text }: ZErrorProps) {
	return (
		<div className={styles.zError}>
			<Icon icon={icon || 'line-md:broken-image-twotone'} className={styles.errorIcon} />
			<h1 className={styles.errorTitle}>{title || '出错了'}</h1>
			<p className={styles.errorText}>{text || '可能是网络问题或页面不存在'}</p>
			<ZButton to="/" text="返回首页" icon="tabler:home" />
		</div>
	)
}
