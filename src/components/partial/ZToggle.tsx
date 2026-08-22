import styles from './ZToggle.module.scss'

interface ZToggleProps {
	label?: string
	value?: boolean
	onChange?: (val: boolean) => void
	children?: React.ReactNode
}

export default function ZToggle({ label, value, onChange, children }: ZToggleProps) {
	return (
		<label className={`${styles.zToggle} z-toggle`}>
			<input
				type="checkbox"
				name="toggle"
				className={styles.inputToggle}
				checked={value}
				onChange={(e) => onChange?.(e.target.checked)}
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						onChange?.(!value)
					}
				}}
			/>
			{children || (label && <span>{label}</span>)}
		</label>
	)
}
