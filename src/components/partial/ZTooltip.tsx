import type { Placement } from '@floating-ui/react'
import React, { cloneElement, isValidElement, useCallback, useRef, useState } from 'react'
import {
	arrow,
	autoUpdate,
	flip,
	FloatingPortal,
	offset,
	safePolygon,
	shift,
	useClick,
	useDismiss,
	useFloating,
	useFocus,
	useHover,
	useInteractions,
	useRole,
} from '@floating-ui/react'

export interface ZTooltipProps {
	content: React.ReactNode
	children: React.ReactNode
	placement?: Placement
	disabled?: boolean
	interactive?: boolean
	delay?: number | { open?: number, close?: number }
	className?: string
}

export default function ZTooltip({
	content,
	children,
	placement = 'top',
	disabled = false,
	interactive = false,
	delay = 100,
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
			offset(10),
			flip({ fallbackAxisSideDirection: 'start' }),
			shift({ padding: 8 }),
			arrow({ element: arrowRef }),
		],
	})

	const hover = useHover(context, {
		delay: typeof delay === 'number' ? { open: delay, close: 80 } : delay,
		handleClose: interactive ? safePolygon({ buffer: 2, blockPointerEvents: false }) : undefined,
	})
	const click = useClick(context, {
		enabled: interactive,
	})
	const focus = useFocus(context)
	const dismiss = useDismiss(context, {
		referencePress: false,
	})
	const role = useRole(context, { role: interactive ? 'dialog' : 'tooltip' })

	const { getReferenceProps, getFloatingProps } = useInteractions([
		hover,
		click,
		focus,
		dismiss,
		role,
	])

	const childrenRef = (children as any)?.ref
	const handleRef = useCallback((node: any) => {
		refs.setReference(node)
		if (typeof childrenRef === 'function') {
			childrenRef(node)
		} else if (childrenRef && typeof childrenRef === 'object') {
			childrenRef.current = node
		}
	}, [refs, childrenRef])

	if (disabled || !content) {
		return <>{children}</>
	}

	const basePlacement = context.placement.split('-')[0]

	return (
		<>
			{isValidElement(children) ? (
				cloneElement(children as React.ReactElement<any>, {
					ref: handleRef,
					...getReferenceProps((children as React.ReactElement).props as any),
				})
			) : (
				<span ref={handleRef} {...getReferenceProps()}>
					{children}
				</span>
			)}
			<FloatingPortal>
				{isOpen && (
					<div
						data-tippy-root=""
						ref={refs.setFloating}
						style={{
							...floatingStyles,
							zIndex: 9999,
							visibility: context.isPositioned ? 'visible' : 'hidden',
						}}
						{...getFloatingProps()}
					>
						<div
							className={`tippy-box ${className}`.trim()}
							data-placement={basePlacement}
							data-state="visible"
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
									[basePlacement === 'top'
										? 'bottom'
										: basePlacement === 'bottom'
											? 'top'
											: basePlacement === 'left'
												? 'right'
												: 'left']: '-6px',
									transform: basePlacement === 'bottom'
										? 'rotate(180deg)'
										: basePlacement === 'left'
											? 'rotate(-90deg)'
											: basePlacement === 'right'
												? 'rotate(90deg)'
												: 'none',
								}}
							>
								<path d="M0 6s1.796-.013 4.67-3.615C5.851.9 6.93.006 8 0c1.07-.006 2.148.887 3.343 2.385C14.233 6.005 16 6 16 6H0z" />
							</svg>
						</div>
					</div>
				)}
			</FloatingPortal>
		</>
	)
}
