'use client'

import styles from './ZToggle.module.scss'

interface ZToggleProps {
	label?: string
	value: boolean
	onChange: (val: boolean) => void
}

export default function ZToggle({ label, value, onChange }: ZToggleProps) {
	return (
		<label className={styles.zToggle}>
			{label && <span className={styles.label}>{label}</span>}
			<div 
				className={`${styles.track} ${value ? styles.active : ''}`}
				onClick={() => onChange(!value)}
			>
				<div className={styles.thumb} />
			</div>
		</label>
	)
}
