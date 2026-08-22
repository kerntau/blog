import type { RefObject } from 'react'
import { useCallback, useRef, useState } from 'react'

export default function useCopy(target: string | RefObject<HTMLElement | null>) {
	const [isCopied, setIsCopied] = useState(false)
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const copy = useCallback(async () => {
		let text = ''
		if (typeof target === 'string') {
			text = target
		} else if (target.current) {
			if (target.current instanceof HTMLInputElement || target.current instanceof HTMLTextAreaElement) {
				text = target.current.value
			} else {
				text = target.current.textContent || ''
			}
		}

		if (!text) return

		try {
			await navigator.clipboard.writeText(text)
			setIsCopied(true)
			if (timeoutRef.current) clearTimeout(timeoutRef.current)
			timeoutRef.current = setTimeout(() => setIsCopied(false), 2000)
		} catch (e) {
			console.error('Failed to copy text', e)
		}
	}, [target])

	return { isCopied, copy }
}
