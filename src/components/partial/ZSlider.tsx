import React, { useId, useRef, useEffect } from 'react'
import styles from './ZSlider.module.scss'

export interface ZSliderListItem {
	value: string
	label?: string
}

export interface ZSliderProps {
	label?: string
	value: number
	onChange: (val: number) => void
	min?: number | string
	max?: number | string
	step?: number | string
	springMin?: number
	springMax?: number
	list?: (string | ZSliderListItem)[]
	className?: string
	children?: React.ReactNode
}

export default function ZSlider({
	label,
	value,
	onChange,
	min = 0,
	max = 100,
	step = 1,
	springMin,
	springMax,
	list,
	className = '',
	children,
}: ZSliderProps) {
	const initialValueRef = useRef(value)
	const id = useId()

	const formattedList = list?.map(v => typeof v === 'string' ? { value: v } : v)

	const springTimerRef = useRef<any>(null)

	const handleSpring = (currentVal: number) => {
		if (springTimerRef.current) clearTimeout(springTimerRef.current)
		springTimerRef.current = setTimeout(() => {
			if (springMin !== undefined && currentVal < springMin) {
				onChange(springMin)
			} else if (springMax !== undefined && currentVal > springMax) {
				onChange(springMax)
			}
		}, 500)
	}

	useEffect(() => {
		return () => {
			if (springTimerRef.current) clearTimeout(springTimerRef.current)
		}
	}, [])

	return (
		<label className={`${styles.zSlider} z-slider ${className}`}>
			{children || (label && <span>{label}</span>)}
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				list={list ? id : undefined}
				onChange={(e) => {
					const num = Number(e.target.value)
					onChange(num)
					handleSpring(num)
				}}
				onDoubleClick={() => onChange(initialValueRef.current)}
				className={styles.inputSlider}
			/>
			<data className={styles.dataValue} value={value}>
				{value}
			</data>

			{formattedList && (
				<datalist id={id}>
					{formattedList.map(({ value: val, label: text }) => (
						<option key={val} value={val} label={text} />
					))}
				</datalist>
			)}
		</label>
	)
}
