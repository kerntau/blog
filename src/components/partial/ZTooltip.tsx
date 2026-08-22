'use client'

import React, { useState, useRef, cloneElement, isValidElement } from 'react'
import {
	useFloating,
	autoUpdate,
	offset,
	flip,
	shift,
	useHover,
	useFocus,
	useDismiss,
	useRole,
	useInteractions,
	FloatingPortal,
	arrow,
	safePolygon,
	type Placement,
} from '@floating-ui/react'

export interface ZTooltipProps {
	content: React.ReactNode
	children: React.ReactNode
	placement?: Placement
	disabled?: boolean
	interactive?: boolean
	delay?: number | { open?: number; close?: number }
	className?: string
}

export default function ZTooltip({
	content,
	children,
	placement = 'top',
	disabled = false,
	interactive = false,
	delay,
	className = '',
}: ZTooltipProps) {
	const [isOpen, setIsOpen] = useState(false)
	const arrowRef = useRef<SVGSVGElement>(null)

	const { refs, floatingStyles, context } = useFloating({
		open: isOpen,
		onOpenChange: setIsOpen,
		placement,
		whileElementsMounted: autoUpdate,
		middleware: [
			offset(10), // tippy default offset
			flip({ fallbackAxisSideDirection: 'start' }),
			shift({ padding: 5 }),
			arrow({ element: arrowRef }),
		],
	})

	const hover = useHover(context, {
		move: false,
		delay,
		handleClose: interactive ? safePolygon() : undefined,
	})
	const focus = useFocus(context)
	const dismiss = useDismiss(context)
	const role = useRole(context, { role: interactive ? 'dialog' : 'tooltip' })

	const { getReferenceProps, getFloatingProps } = useInteractions([
		hover,
		focus,
		dismiss,
		role,
	])

	if (disabled || !content) {
		return <>{children}</>
	}

	const basePlacement = context.placement.split('-')[0]

	return (
		<>
			{isValidElement(children) ? cloneElement(children as React.ReactElement, getReferenceProps({
				ref: refs.setReference,
				...((children as React.ReactElement).props || {}),
			})) : (
				<span ref={refs.setReference} {...getReferenceProps()}>
					{children}
				</span>
			)}
			<FloatingPortal>
				{isOpen && (
					<div
						className={`tippy-box ${className}`.trim()}
						ref={refs.setFloating}
						style={floatingStyles}
						{...getFloatingProps()}
					>
						{content}
						<svg
							className="tippy-svg-arrow"
							width="16"
							height="6"
							xmlns="http://www.w3.org/2000/svg"
							ref={arrowRef}
							style={{
								position: 'absolute',
								left: context.middlewareData.arrow?.x != null ? `${context.middlewareData.arrow.x}px` : '',
								top: context.middlewareData.arrow?.y != null ? `${context.middlewareData.arrow.y}px` : '',
								right: '',
								bottom: '',
								[basePlacement === 'top' ? 'bottom' :
								basePlacement === 'bottom' ? 'top' :
								basePlacement === 'left' ? 'right' : 'left']: '-6px',
								transform: basePlacement === 'bottom' ? 'rotate(180deg)' :
									basePlacement === 'left' ? 'rotate(-90deg)' :
									basePlacement === 'right' ? 'rotate(90deg)' : 'none',
							}}
						>
							<path d="M0 6s1.796-.013 4.67-3.615C5.851.9 6.93.006 8 0c1.07-.006 2.148.887 3.343 2.385C14.233 6.005 16 6 16 6H0z" />
						</svg>
					</div>
				)}
			</FloatingPortal>
		</>
	)
}
