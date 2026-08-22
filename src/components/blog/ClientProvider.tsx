'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { useSearchStore } from '../../stores/search'
import { useLayoutStore } from '../../stores/layout'
import Search from '../popover/Search'

export default function ClientProvider({ children }: { children: ReactNode }) {
	const [mounted, setMounted] = useState(false)
	const setIsOpen = useSearchStore(s => s.setIsOpen)
	const closeLayout = useLayoutStore(s => s.close)

	useEffect(() => {
		setMounted(true)

		// 1. 开发环境禁用 Umami 统计
		if (process.env.NODE_ENV === 'development') {
			try {
				localStorage.setItem('umami.disabled', 'true')
			} catch {}
		}

		// 2. 全局快捷键与 Konami 彩蛋
		const konamiCode = [
			'ArrowUp',
			'ArrowUp',
			'ArrowDown',
			'ArrowDown',
			'ArrowLeft',
			'ArrowRight',
			'ArrowLeft',
			'ArrowRight',
			'KeyB',
			'KeyA',
		]
		let currentStep = 0

		const handleKeyDown = (e: KeyboardEvent) => {
			// Cmd + K or Ctrl + K -> 打开搜索
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault()
				setIsOpen(true)
				return
			}

			// '/' 快捷键呼出搜索（当未在输入框中打字时）
			if (
				e.key === '/'
				&& !e.ctrlKey
				&& !e.metaKey
				&& !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
				&& !(e.target as HTMLElement)?.isContentEditable
			) {
				e.preventDefault()
				setIsOpen(true)
				return
			}

			// Escape 键关闭侧栏与搜索
			if (e.key === 'Escape') {
				closeLayout()
				setIsOpen(false)
				return
			}

			// Konami Code (上上下下左右左右BA -> 切换 dir="rtl"/"ltr")
			if (e.code === konamiCode[currentStep]) {
				currentStep++
				if (currentStep === konamiCode.length) {
					const currentDir = document.documentElement.getAttribute('dir') || 'ltr'
					document.documentElement.setAttribute('dir', currentDir === 'ltr' ? 'rtl' : 'ltr')
					currentStep = 0
				}
			} else {
				currentStep = e.code === konamiCode[0] ? 1 : 0
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [closeLayout, setIsOpen])

	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			{mounted ? (
				<>
					{children}
					<Search />
				</>
			) : (
				children
			)}
		</ThemeProvider>
	)
}
