'use client'

import React, { useRef } from 'react'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

export function getVueClassNames(name: string) {
	return {
		enter: `${name}-enter-from`,
		enterActive: `${name}-enter-active`,
		enterDone: `${name}-enter-to`,
		exit: `${name}-leave-from`,
		exitActive: `${name}-leave-active`,
		exitDone: `${name}-leave-to`,
	}
}

export function ZCSSTransition({ name, classNames, children, nodeRef, ...props }: any) {
	const internalRef = useRef(null)
	const activeRef = nodeRef || internalRef

	const child = React.Children.only(children)
	const childWithRef = React.isValidElement(child)
		? React.cloneElement(child as any, { ref: activeRef })
		: child

	return (
		<CSSTransition
			nodeRef={activeRef}
			classNames={classNames || getVueClassNames(name)}
			{...props}
		>
			{childWithRef}
		</CSSTransition>
	)
}

export const ZTransitionGroup = TransitionGroup
