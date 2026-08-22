'use client'

import { useEffect, useRef } from 'react'
import abcjs from 'abcjs'

export default function MusicScore({ abc }: { abc: string }) {
	const elRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (elRef.current && abc) {
			try {
				abcjs.renderAbc(elRef.current, abc, {
					responsive: 'resize',
					paddingbottom: 0,
					paddingtop: 0,
					paddingleft: 0,
					paddingright: 0,
				})
			} catch (e) {
				console.error('Failed to render ABC score:', e)
			}
		}
	}, [abc])

	return (
		<div className="music-score-container" style={{ overflow: 'auto', margin: '1rem 0' }}>
			<div ref={elRef} />
		</div>
	)
}
