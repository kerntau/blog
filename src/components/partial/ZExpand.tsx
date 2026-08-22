'use client'

import { useState, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { ZCSSTransition } from '../util/ZTransition'
import styles from './ZExpand.module.scss'

interface ZExpandProps {
	name?: string
	inPlace?: boolean
	children?: React.ReactNode
	value?: boolean
	onChange?: (val: boolean) => void
}

export default function ZExpand({ name, inPlace, children, value: propsValue, onChange }: ZExpandProps) {
	const [isOpen, setIsOpen] = useState(propsValue || false)
	const nodeRef = useRef(null)
	
	useEffect(() => {
		if (propsValue !== undefined) {
			setIsOpen(propsValue)
		}
	}, [propsValue])
	
	const toggle = () => {
		const next = !isOpen
		if (propsValue === undefined) {
			setIsOpen(next)
		}
		onChange?.(next)
	}

	return (
		<div className={`${styles.zExpand} z-expand`}>
			<ZCSSTransition
				in={isOpen}
				name="collapse"
				timeout={100}
				unmountOnExit
				nodeRef={nodeRef}
			>
				<div ref={nodeRef} className={styles.content}>
					{children}
				</div>
			</ZCSSTransition>

			<button
				className={`${styles.toggleBtn} toggle-btn ${inPlace ? `${styles.inPlace} in-place` : ''}`}
				onClick={toggle}
				style={inPlace ? { order: -1 } : {}}
			>
				<Icon icon="tabler:chevrons-down" className={`${styles.toggleIcon} toggle-icon ${isOpen ? `${styles.expand} expand` : ''}`} />
				<span>{`${isOpen ? '收起' : '展开'}${name || ''}`}</span>
			</button>
		</div>
	)
}
