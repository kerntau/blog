'use client'

import React, { useState, cloneElement, isValidElement } from 'react'
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
	useClick,
} from '@floating-ui/react'
import styles from './ZDropdown.module.scss'

export interface ZDropdownProps {
	children: React.ReactNode
	content: (props: { hide: () => void }) => React.ReactNode
	trigger?: 'click' | 'focusin' | 'hover'
	placement?: 'bottom-start' | 'bottom' | 'bottom-end' | 'top' | 'top-start' | 'top-end'
	interactive?: boolean
}

export default function ZDropdown({
	children,
	content,
	placement = 'bottom-start',
	trigger = 'click',
	interactive = true,
}: ZDropdownProps) {
	const [isOpen, setIsOpen] = useState(false)

	const { refs, floatingStyles, context } = useFloating({
		open: isOpen,
		onOpenChange: setIsOpen,
		placement,
		whileElementsMounted: autoUpdate,
		middleware: [
			offset(0), // Nuxt used [0, 0] offset for dropdown
			flip({ fallbackAxisSideDirection: 'start' }),
			shift({ padding: 5 }),
		],
	})

	const click = useClick(context, { enabled: trigger === 'click' })
	const hover = useHover(context, { enabled: trigger === 'hover', handleClose: interactive ? undefined : null })
	const focus = useFocus(context, { enabled: trigger === 'focusin' || trigger === 'hover' })
	const dismiss = useDismiss(context)
	const role = useRole(context, { role: 'menu' })

	const { getReferenceProps, getFloatingProps } = useInteractions([
		click,
		hover,
		focus,
		dismiss,
		role,
	])

	const hide = () => setIsOpen(false)

	return (
		<>
			{isValidElement(children) ? cloneElement(children as React.ReactElement, getReferenceProps({
				ref: refs.setReference,
				...((children as React.ReactElement).props || {}),
			})) : (
				<span ref={refs.setReference} {...getReferenceProps()} className={styles.dropdownTrigger}>
					{children}
				</span>
			)}

			<FloatingPortal>
				{isOpen && (
					<div
						className="tippy-box"
						ref={refs.setFloating}
						style={{ ...floatingStyles, outline: 'none' }}
						{...getFloatingProps()}
						data-placement={context.placement.split('-')[0]}
					>
						<div className={styles.tippyContent}>
							{content({ hide })}
						</div>
					</div>
				)}
			</FloatingPortal>
		</>
	)
}
