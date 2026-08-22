import React from 'react'
import styles from './ZRadioGroup.module.scss'

export interface RadioItem<T = any> {
	label?: React.ReactNode
	value: T
}

export interface ZRadioGroupProps<T = any> {
	items: RadioItem<T>[]
	value: T
	onChange: (value: T) => void
	className?: string
}

export default function ZRadioGroup<T = any>({
	items,
	value,
	onChange,
	className = '',
}: ZRadioGroupProps<T>) {
	return (
		<div className={`${styles.zRadioGroup} z-radio-group ${className}`.trim()}>
			{items.map((item, i) => {
				const isActive = item.value === value
				return (
					<button
						key={i}
						type="button"
						className={`${styles.radioItem} radio-item ${isActive ? `${styles.active} active` : ''}`.trim()}
						onClick={() => onChange(item.value)}
					>
						{item.label || String(item.value)}
					</button>
				)
			})}
		</div>
	)
}
