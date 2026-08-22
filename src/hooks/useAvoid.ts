import type { RefObject } from 'react'
import { useEffect, useState } from 'react'
import { useLayoutStore } from '../stores/layout'

export function useAvoidTransform(originRef: RefObject<HTMLElement | null>) {
	const avoidTargets = useLayoutStore((state) => state.avoidTargets)
	const [transform, setTransform] = useState('')

	useEffect(() => {
		let animationFrameId: number

		const updateTransform = () => {
			const origin = originRef.current
			if (!origin) return

			const style = getComputedStyle(origin)
			const bottom = Number.parseFloat(style.bottom) || 0
			const right = Number.parseFloat(style.insetInlineEnd || style.right) || 0
			const windowHeight = window.innerHeight
			const windowWidth = window.innerWidth

			const originRect = {
				top: windowHeight - bottom - origin.offsetHeight,
				bottom: windowHeight - bottom,
				left: windowWidth - right - origin.offsetWidth,
				right: windowWidth - right,
			}

			const shifts = avoidTargets
				.map((targetRef) => targetRef.current?.getBoundingClientRect())
				.filter((rect): rect is DOMRect => !!rect)
				.filter(({ top, bottom, left, right }) => {
					const hasHOverlap = originRect.left < right && originRect.right > left
					const hasVOverlap = top < originRect.bottom && bottom > originRect.top
					return hasHOverlap && hasVOverlap
				})
				.map(({ top }) => originRect.bottom - top)

			if (shifts.length > 0) {
				const maxShift = Math.max(...shifts)
				setTransform(maxShift > 0 ? `translateY(-${maxShift + 16}px)` : '')
			} else {
				setTransform('')
			}

			animationFrameId = requestAnimationFrame(updateTransform)
		}

		animationFrameId = requestAnimationFrame(updateTransform)
		return () => cancelAnimationFrame(animationFrameId)
	}, [avoidTargets, originRef])

	return transform
}

export function useAvoidTarget(targetRef: RefObject<HTMLElement | null>, active = true) {
	const addAvoidTarget = useLayoutStore((state) => state.addAvoidTarget)
	const removeAvoidTarget = useLayoutStore((state) => state.removeAvoidTarget)

	useEffect(() => {
		if (active) {
			addAvoidTarget(targetRef)
		} else {
			removeAvoidTarget(targetRef)
		}

		return () => {
			removeAvoidTarget(targetRef)
		}
	}, [active, targetRef, addAvoidTarget, removeAvoidTarget])
}
