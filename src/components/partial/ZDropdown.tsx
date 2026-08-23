import React, { useState } from 'react'
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

	const { refs, floatingStyles, isPositioned, context } = useFloating({
		open: isOpen,
		onOpenChange: setIsOpen,
		placement,
		whileElementsMounted: autoUpdate,
		middleware: [
			offset(6),
			flip({ fallbackAxisSideDirection: 'start' }),
			shift({ padding: 8 }),
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
			<span
				ref={refs.setReference}
				{...getReferenceProps()}
				className={styles.dropdownTrigger}
			>
				{children}
			</span>

			<FloatingPortal>
				{isOpen && (
					<div
						className={styles.tippyBox}
						ref={refs.setFloating}
						style={{
							...floatingStyles,
							outline: 'none',
							zIndex: 9999,
							visibility: isPositioned ? 'visible' : 'hidden',
						}}
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
