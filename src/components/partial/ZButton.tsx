import { Icon } from '@iconify/react'
import UtilLink from '../util/UtilLink'
import styles from './ZButton.module.scss'

export interface ZButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	icon?: string
	text?: string
	to?: string
	desc?: string
	primary?: boolean
	className?: string
}

export default function ZButton({
	icon,
	text,
	to,
	desc,
	primary,
	className = '',
	children,
	...props
}: ZButtonProps) {
	const content = (
		<>
			<div className={styles.buttonMain}>
				{icon && <Icon icon={icon} />}
				{children || text}
			</div>
			{desc && <div className={styles.buttonDesc}>{desc}</div>}
		</>
	)

	const btnClass = `${styles.button} ${primary ? styles.primary : ''} ${className}`.trim()

	if (to) {
		return (
			<UtilLink to={to} className={btnClass} {...(props as any)}>
				{content}
			</UtilLink>
		)
	}

	return (
		<button className={btnClass} {...props}>
			{content}
		</button>
	)
}
