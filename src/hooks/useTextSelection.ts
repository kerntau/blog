import { useState, useEffect } from 'react'

export function useTextSelection() {
	const [text, setText] = useState('')

	useEffect(() => {
		const handleSelectionChange = () => {
			const selection = window.getSelection()
			setText(selection ? selection.toString() : '')
		}

		document.addEventListener('selectionchange', handleSelectionChange)
		return () => document.removeEventListener('selectionchange', handleSelectionChange)
	}, [])

	return { text }
}
