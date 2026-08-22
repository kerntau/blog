import styles from './ProseCode.module.scss'

interface ProseCodeProps {
	children?: React.ReactNode
	className?: string
}

export default function ProseCode({ children, className }: ProseCodeProps) {
	return (
		<code className={`${styles.code} ${className || ''}`}>
			{children}
		</code>
	)
}
