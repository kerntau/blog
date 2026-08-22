'use client'

import { Icon } from '@iconify/react'
import {
	autoUpdate,
	flip,
	offset,
	shift,
	useFloating,
} from '@floating-ui/react'
import { useEffect, useRef, useState } from 'react'
import appConfig from '../../app.config'
import ZButton from '../partial/ZButton'
import styles from './PostComment.module.scss'

function safelyDecodeUriComponent(uri: string) {
	try {
		return decodeURI(uri)
	} catch {
		return uri
	}
}

export default function PostComment() {
	const commentRef = useRef<HTMLElement>(null)
	const inputRef = useRef<HTMLSpanElement>(null)
	const [popoverJumpTo, setPopoverJumpTo] = useState('')
	const [showPopover, setShowPopover] = useState(false)
	const [showUndo, setShowUndo] = useState(false)
	const { refs, floatingStyles } = useFloating({
		open: showPopover,
		onOpenChange: setShowPopover,
		whileElementsMounted: autoUpdate,
		middleware: [offset(8), flip(), shift({ padding: 8 })],
	})

	const initTwikoo = () => {
		if (typeof (window as any).twikoo?.init === 'function') {
			(window as any).twikoo.init({
				envId: appConfig.twikoo?.envId,
				el: '#twikoo',
			})
		}
	}

	useEffect(() => {
		initTwikoo()
	}, [])

	useEffect(() => {
		if (showPopover && inputRef.current) {
			inputRef.current.textContent = popoverJumpTo
			setShowUndo(false)
		}
	}, [showPopover, popoverJumpTo])

	useEffect(() => {
		const commentEl = commentRef.current
		if (!commentEl) return

		const onClick = (e: MouseEvent) => {
			if (!(e.target instanceof Element)) return

			if (e.target.matches('.tk-avatar-img')) {
				e.stopPropagation()
			}

			const popoverTarget = e.target.closest('a[target="_blank"]')
			if (!(popoverTarget instanceof HTMLAnchorElement)) return

			e.preventDefault()
			setShowPopover(false)
			refs.setReference(popoverTarget)
			setPopoverJumpTo(safelyDecodeUriComponent(popoverTarget.href))
			window.requestAnimationFrame(() => setShowPopover(true))
		}

		commentEl.addEventListener('click', onClick, { capture: true })
		return () => commentEl.removeEventListener('click', onClick, { capture: true })
	}, [refs])

	useEffect(() => {
		if (!showPopover) return

		const onPointerDown = (event: PointerEvent) => {
			const target = event.target
			if (!(target instanceof Node)) return
			if (commentRef.current?.contains(target) || refs.floating.current?.contains(target)) return
			setShowPopover(false)
		}

		document.addEventListener('pointerdown', onPointerDown)
		return () => document.removeEventListener('pointerdown', onPointerDown)
	}, [refs.floating, showPopover])

	function checkUndoable() {
		setShowUndo(inputRef.current?.textContent !== popoverJumpTo)
	}

	function undo() {
		if (!inputRef.current) return
		inputRef.current.textContent = popoverJumpTo
		checkUndoable()
	}

	function confirmOpen() {
		const url = inputRef.current?.textContent
		if (url) {
			window.open(url, '_blank')
			setShowPopover(false)
		}
	}

	return (
		<section ref={commentRef} className={styles.zComment}>
			<h3 className="text-creative">评论区</h3>
			<div id="twikoo" className={styles.twikoo}>
				<p>评论加载中...</p>
			</div>
			{showPopover && (
				<div
					ref={refs.setFloating}
					className={styles.popoverFloating}
					style={floatingStyles}
				>
					<div className={styles.popoverConfirm}>
						<span
							ref={inputRef}
							className={styles.input}
							contentEditable="plaintext-only"
							spellCheck={false}
							onInput={checkUndoable}
							onKeyDown={(event) => {
								if (event.key === 'Enter') {
									event.preventDefault()
									confirmOpen()
								}
							}}
						/>
						{showUndo && (
							<button
								type="button"
								aria-label="恢复原始内容"
								onClick={undo}
							>
								<Icon icon="tabler:arrow-back-up" />
							</button>
						)}
						<ZButton primary text="访问" onClick={confirmOpen} />
					</div>
				</div>
			)}
		</section>
	)
}
