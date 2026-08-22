'use client'

import { useEffect, useRef } from 'react'

export function useResizeObserver(callback: (entry: ResizeObserverEntry) => void) {
	const ref = useRef<any>(null)

	useEffect(() => {
		if (!ref.current) return
		const observer = new ResizeObserver(([entry]) => {
			callback(entry)
		})
		observer.observe(ref.current)
		return () => observer.disconnect()
	}, [callback])

	return ref
}
