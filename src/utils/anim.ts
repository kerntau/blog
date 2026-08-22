import type { CSSProperties } from 'react'

export function getFixedDelay(s: number, fixed = 2): CSSProperties {
	return {
		'--delay': `${s.toFixed(fixed)}s`,
	} as CSSProperties
}
