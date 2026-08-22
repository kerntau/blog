'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './ZDropdown.module.scss'

interface ZDropdownProps {
	children: React.ReactNode
	content: (props: { hide: () => void }) => React.ReactNode
	tabIndex?: number
}

export default function ZDropdown({ children, content, tabIndex = 0 }: ZDropdownProps) {
	const [isOpen, setIsOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	return (
		<div
			className={styles.dropdownContainer}
			ref={containerRef}
			tabIndex={tabIndex}
		>
			<div 
				className={styles.dropdownTrigger}
				onClick={() => setIsOpen((prev) => !prev)}
			>
				{children}
			</div>

			{isOpen && (
				<div className={styles.dropdownContent}>
					{content({ hide: () => setIsOpen(false) })}
				</div>
			)}
		</div>
	)
}
