'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './ZDropdown.module.scss'

interface ZDropdownProps {
	children: React.ReactNode
	content: (props: { hide: () => void }) => React.ReactNode
	tabIndex?: number
	trigger?: 'click' | 'focusin'
	placement?: 'bottom-start' | 'bottom' | 'bottom-end'
}

export default function ZDropdown({
	children,
	content,
	placement = 'bottom-start',
}: ZDropdownProps) {
	const [isOpen, setIsOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	const hide = useCallback(() => {
		setIsOpen(false)
	}, [])

	useEffect(() => {
		if (!isOpen) return

		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false)
			}
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen])

	const toggle = (e: React.MouseEvent) => {
		e.stopPropagation()
		setIsOpen(prev => !prev)
	}

	return (
		<div className={styles.dropdownContainer} ref={containerRef}>
			<div className={styles.dropdownTrigger} onClick={toggle}>
				{children}
			</div>

			{isOpen && (
				<div className={`${styles.dropdownContent} ${styles[placement] || ''}`}>
					<div className={styles.tippyBox}>
						<div className={styles.tippyContent}>
							{content({ hide })}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
