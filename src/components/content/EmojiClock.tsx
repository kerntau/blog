'use client'

import { useState, useEffect, useMemo } from 'react'
import { Temporal } from 'temporal-polyfill'
import { toZonedTemporal } from '../../utils/time'

export default function EmojiClock({ datetime: propsDatetime, rotate }: { datetime?: string, rotate?: boolean }) {
	const [now, setNow] = useState(() => Temporal.Now.zonedDateTimeISO())

	useEffect(() => {
		if (propsDatetime) return
		const timer = setInterval(() => {
			setNow(Temporal.Now.zonedDateTimeISO())
		}, 30000)
		return () => clearInterval(timer)
	}, [propsDatetime])

	const dt = useMemo(() => propsDatetime ? toZonedTemporal(propsDatetime) : now, [propsDatetime, now])

	const emojiStatic = ['🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠', '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦']
	const emojiRotate = ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚']

	const status = useMemo(() => {
		const { hour, minute } = dt
		if (!rotate) {
			const index = (hour * 2 + Math.round(minute / 30)) % emojiStatic.length
			return { emoji: emojiStatic[index] }
		}
		const minuteAt = Math.round(minute / 5)
		const index = (hour % 12 - minuteAt + emojiRotate.length) % emojiRotate.length
		return { rotate: minuteAt * 30, emoji: emojiRotate[index] }
	}, [dt, rotate])

	return (
		<span
			className={`emoji-clock ${rotate ? 'rotate-clock' : ''}`}
			style={{ '--deg': rotate ? `${status.rotate}deg` : undefined } as any}
		>
			{status.emoji}
			<style jsx>{`
				.rotate-clock {
					display: inline-block;
					transform: rotate(var(--deg, 0deg));
				}
			`}
   </style>
		</span>
	)
}
