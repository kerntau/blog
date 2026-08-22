interface Rect {
	left: number | string
	top: number | string
	width: number | string
	height: number | string
}

function toRect(rect: Element | Rect): Rect {
	return rect instanceof Element ? rect.getBoundingClientRect() : rect
}

const ensurePx = (val: number | string) => typeof val === 'number' ? `${val}px` : val

export function animateBetweenRects(
	el: Element,
	rect: (Element | Rect) | (Element | Rect)[],
	options?: KeyframeAnimationOptions,
) {
	const rects = (Array.isArray(rect) ? rect : [rect]).map(r => toRect(r instanceof Element ? r : r))

	return el.animate(rects.map(r => ({
		left: ensurePx(r.left),
		top: ensurePx(r.top),
		width: ensurePx(r.width),
		height: ensurePx(r.height),
	})), {
		duration: 100,
		fill: 'forwards',
		...options,
	})
}

export const getFixedDelay = (s: number, fixed = 2) => ({ '--delay': `${s.toFixed(fixed)}s` } as React.CSSProperties)
