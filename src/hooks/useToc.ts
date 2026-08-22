import type { RefObject } from 'react'
import { useEffect, useState } from 'react'
import type { TocItem } from '../stores/layout'

interface TocList {
	id: string
	offsetTop: number
}

export function useToc(toc: TocItem[] | undefined, scrollableElRef?: RefObject<HTMLElement | null>) {
	const [activeHeadingId, setActiveHeadingId] = useState<string>()
	const [tocOffsets, setTocOffsets] = useState<TocList[]>([])

	// Update offsets on mount and window resize
	useEffect(() => {
		let timeoutId: NodeJS.Timeout
		const updateOffsets = () => {
			if (toc && toc.length > 0) {
				const offsets: TocList[] = []
				toc.forEach((item) => {
					const headingEl = document.getElementById(item.id)
					if (headingEl) {
						offsets.push({ id: item.id, offsetTop: headingEl.offsetTop })
					}
				})
				setTocOffsets(offsets.reverse())
			}
		}

		const handleResize = () => {
			clearTimeout(timeoutId)
			timeoutId = setTimeout(updateOffsets, 200)
		}

		// Use a slight delay to allow layout to settle before calculating offsets
		timeoutId = setTimeout(updateOffsets, 100)
		window.addEventListener('resize', handleResize)
		return () => {
			window.removeEventListener('resize', handleResize)
			clearTimeout(timeoutId)
		}
	}, [toc])

	// Update active heading on scroll
	useEffect(() => {
		let ticking = false
		const handleScroll = () => {
			if (!ticking) {
				requestAnimationFrame(() => {
					const scrollMargin = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('scroll-margin-top')) || 64
					const scrollPosition = window.scrollY + scrollMargin

					const activeItem = tocOffsets.find(item => item.offsetTop <= scrollPosition)
					setActiveHeadingId(activeItem?.id)
					ticking = false
				})
				ticking = true
			}
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		handleScroll() // Init
		return () => window.removeEventListener('scroll', handleScroll)
	}, [tocOffsets])

	const scrollToActiveTocItem = () => {
		const el = scrollableElRef?.current
		if (!el || !activeHeadingId) return

		const active = el.querySelector<HTMLLinkElement>(`a[href="#${activeHeadingId}"]`)
		if (active) {
			el.scrollTo({
				top: active.offsetTop - el.clientHeight / 4,
				behavior: 'smooth',
			})
		}
	}

	useEffect(() => {
		scrollToActiveTocItem()
	}, [activeHeadingId])

	return {
		tocOffsets,
		activeHeadingId,
	}
}
