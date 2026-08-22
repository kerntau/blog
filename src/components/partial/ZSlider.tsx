'use client'

import styles from './ZSlider.module.scss'

interface ZSliderProps {
	label?: string
	value: number
	onChange: (val: number) => void
	min?: number
	max?: number
	step?: number
}

export default function ZSlider({
	label,
	value,
	onChange,
	min = 0,
	max = 100,
	step = 1
}: ZSliderProps) {
	return (
		<div className={styles.zSlider}>
			{label && <span className={styles.label}>{label}</span>}
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className={styles.range}
			/>
			<span className={styles.value}>{value}</span>
		</div>
	)
}
