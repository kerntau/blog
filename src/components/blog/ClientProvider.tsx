'use client'

import { useEffect } from 'react'
import { useSearchStore } from '../../stores/search'
import { useLayoutStore } from '../../stores/layout'
import Search from '../popover/Search'

export default function ClientProvider({ children }: { children: React.ReactNode }) {
	const setIsOpen = useSearchStore(s => s.setIsOpen)
	const closeLayout = useLayoutStore(s => s.close)

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Cmd + K or Ctrl + K
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault()
				setIsOpen(true)
			}
		}
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return
			closeLayout()
			setIsOpen(false)
		}
		window.addEventListener('keydown', handleKeyDown)
		window.addEventListener('keydown', handleEscape)

		const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']
		let currentStep = 0

		const handleKonami = (e: KeyboardEvent) => {
			if (e.code === konamiCode[currentStep]) {
				currentStep++
				if (currentStep === konamiCode.length) {
					const dir = document.documentElement.dir === 'rtl' ? 'ltr' : 'rtl'
					document.documentElement.dir = dir
					currentStep = 0
				}
			} else {
				currentStep = e.code === konamiCode[0] ? 1 : 0
			}
		}

		window.addEventListener('keydown', handleKonami)

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
			window.removeEventListener('keydown', handleEscape)
			window.removeEventListener('keydown', handleKonami)
		}
	}, [closeLayout, setIsOpen])

	return (
		<>
			{children}
			<Search />
		</>
	)
}
