'use client'

import { useState, useEffect, useMemo } from 'react'
import styles from './Key.module.scss'

interface KeyProps {
	text?: string
	code?: string
	icon?: boolean
	ctrl?: boolean
	shift?: boolean
	alt?: boolean
	meta?: boolean
	win?: boolean
	cmd?: boolean
	prevent?: boolean
	onPress?: () => void
	className?: string
	children?: React.ReactNode
}

export default function Key(props: KeyProps) {
	const [active, setActive] = useState(false)
	const [isMac, setIsMac] = useState(false)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
		setIsMac(/mac ?os/i.test(navigator?.userAgent))
	}, [])

	const useSymbol = props.icon === undefined ? isMac : props.icon
	const keyJoiner = useSymbol ? '' : '+'

	const displayMap: Record<string, string> = {
		' ': 'Space',
		'ArrowDown': '↓',
		'ArrowLeft': '←',
		'ArrowRight': '→',
		'ArrowUp': '↑',
		'Control': 'Ctrl',
		'Delete': 'Del',
		'Escape': 'Esc',
		'Meta': isMac ? 'Cmd' : 'Win',
	}

	const symbolMap: Record<string, string> = {
		' ': '␣',
		'Alt': '⌥',
		'Backspace': '⌫',
		'Control': '⌃',
		'Delete': '⌦',
		'Enter': '↵',
		'Escape': '⎋',
		'Meta': isMac ? '⌘' : '⊞',
		'Shift': '⇧',
		'Tab': '⇥',
		'Win': '⊞',
	}

	const normalize = (code?: string) => {
		if (!code) return ''
		if (useSymbol && code in symbolMap) return symbolMap[code]
		if (code in displayMap) return displayMap[code]
		return code
	}

	const codeDisplay = useMemo(() => {
		if (props.text) return props.text
		const configs = [
			{ cond: props.cmd, code: isMac ? 'Meta' : 'Control' },
			{ cond: props.ctrl && !props.cmd, code: 'Control' },
			{ cond: props.shift, code: 'Shift' },
			{ cond: props.alt, code: 'Alt' },
			{ cond: props.meta && !props.cmd, code: 'Meta' },
			{ cond: props.win && !props.meta, code: 'Win' },
			{ cond: props.code, code: props.code },
		]
		return configs
			.filter(c => c.cond)
			.map(c => normalize(c.code))
			.join(keyJoiner)
	}, [props, isMac, useSymbol])

	useEffect(() => {
		const handleDown = (e: KeyboardEvent) => {
			if (props.code && e.key.toLowerCase() === props.code.toLowerCase()) {
				setActive(true)
				props.onPress?.()
				if (props.prevent) e.preventDefault()
			}
		}
		const handleUp = (e: KeyboardEvent) => {
			if (props.code && e.key.toLowerCase() === props.code.toLowerCase()) {
				setActive(false)
			}
		}
		window.addEventListener('keydown', handleDown)
		window.addEventListener('keyup', handleUp)
		return () => {
			window.removeEventListener('keydown', handleDown)
			window.removeEventListener('keyup', handleUp)
		}
	}, [props])

	const classNames = [
		styles.kbd,
		active && styles.active,
		props.className
	].filter(Boolean).join(' ')

	return (
		<kbd className={classNames} onClick={props.onPress}>
			{!mounted ? null : (props.children || codeDisplay)}
		</kbd>
	)
}
