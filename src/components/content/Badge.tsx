import styles from './Badge.module.scss'

interface BadgeProps {
	type?: 'tip' | 'info' | 'warning' | 'error' | 'primary'
	text?: string
	children?: React.ReactNode
}

export default function Badge({ type = 'primary', text, children }: BadgeProps) {
	return (
		<span className={`${styles.badge} ${styles[type]}`}>
			{children || text}
		</span>
	)
}
