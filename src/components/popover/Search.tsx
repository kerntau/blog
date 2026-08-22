'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import MiniSearch from 'minisearch'
import { Icon } from '@iconify/react'
import { useSearchStore } from '../../stores/search'
import SearchItem from './SearchItem'
import Key from '../content/Key'
import styles from './Search.module.scss'

export default function Search() {
	const router = useRouter()
	const { word, setWord, isOpen, setIsOpen } = useSearchStore()
	const [debouncedWord, setDebouncedWord] = useState(word)
	const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
	const [activeIndex, setActiveIndex] = useState(0)
	const [isKeyboardMode, setIsKeyboardMode] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const resultsListRef = useRef<HTMLMenuElement>(null)

	// Chinese segmentation support
	const segmenter = useMemo(() => 
		typeof Intl !== 'undefined' && (Intl as any).Segmenter 
			? new (Intl as any).Segmenter('zh-CN', { granularity: 'word' }) 
			: null, [])

	const miniSearch = useMemo(() => new MiniSearch({
		fields: ['title', 'content'],
		storeFields: ['title', 'titles', 'content', 'level'],
		searchOptions: { 
			prefix: true, 
			fuzzy: 0.2, 
			combineWith: 'AND',
			boost: { title: 3, titles: 2 }
		},
		processTerm: segmenter
			? term => Array.from(segmenter.segment(term), (seg: any) => seg.segment.toLowerCase())
			: undefined,
	}), [segmenter])

	useEffect(() => {
		const controller = new AbortController()
		fetch('/api/search', { signal: controller.signal, cache: 'no-store' })
			.then(res => {
				if (!res.ok) throw new Error(`Search index request failed: ${res.status}`)
				return res.json()
			})
			.then(data => {
				miniSearch.addAll(data)
				setStatus('success')
			})
			.catch(error => {
				if (error.name !== 'AbortError') setStatus('error')
			})
		return () => controller.abort()
	}, [miniSearch])

	// Debounce word
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedWord(word), 150)
		return () => clearTimeout(timer)
	}, [word])

	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 100)
		}
	}, [isOpen])

	const results = useMemo(() => {
		if (!debouncedWord) return []
		return miniSearch.search(debouncedWord).slice(0, 20)
	}, [debouncedWord, miniSearch])

	useEffect(() => {
		setActiveIndex(0)
	}, [debouncedWord])

	useEffect(() => {
		const handleMouseMove = () => setIsKeyboardMode(false)
		const handleKeyDownGlobal = () => setIsKeyboardMode(true)
		window.addEventListener('mousemove', handleMouseMove)
		window.addEventListener('keydown', handleKeyDownGlobal)
		return () => {
			window.removeEventListener('mousemove', handleMouseMove)
			window.removeEventListener('keydown', handleKeyDownGlobal)
		}
	}, [])

	useEffect(() => {
		const activeItem = resultsListRef.current?.children[activeIndex] as HTMLElement
		if (activeItem && isKeyboardMode) {
			activeItem.scrollIntoView({ block: 'nearest' })
		}
	}, [activeIndex, isKeyboardMode])

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) return
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setIsKeyboardMode(true)
			setActiveIndex(i => Math.min(i + 1, results.length - 1))
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setIsKeyboardMode(true)
			setActiveIndex(i => Math.max(i - 1, 0))
		} else if (e.key === 'Enter') {
			const activeItem = results[activeIndex]
			if (activeItem) {
				router.push(activeItem.id as string)
				setIsOpen(false)
			}
		} else if (e.key === 'Escape') {
			setIsOpen(false)
		}
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className={styles.overlay}
					onClick={() => setIsOpen(false)}
				>
					<motion.div
						initial={{ y: '20vh', opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: '20vh', opacity: 0 }}
						transition={{ duration: 0.2, ease: 'easeOut' }}
						className={styles.searchModal}
						onClick={e => e.stopPropagation()}
					>
						<form className={styles.inputForm} onSubmit={e => e.preventDefault()}>
							<Icon icon={status === 'pending' ? 'line-md:loading-alt-loop' : 'tabler:search'} className={styles.searchIcon} />
							<input
								ref={inputRef}
								className={styles.searchInput}
								value={word}
								onChange={e => setWord(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="键入开始搜索"
								type="search"
								autoComplete="off"
							/>
						</form>

						<AnimatePresence mode="popLayout">
							<motion.div 
								key="results"
								className={`${styles.resultsContainer} scrollcheck-y`}
								layout
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								transition={{ duration: 0.5 }}
							>
								{debouncedWord && results.length === 0 && status === 'success' && (
									<div className={styles.noResult}>无结果</div>
								)}
								
								{results.length > 0 && (
									<motion.menu 
										ref={resultsListRef}
										className={styles.resultsList}
										variants={{
											show: { transition: { staggerChildren: 0.05 } }
										}}
										initial="hidden"
										animate="show"
									>
										{results.map((item, i) => (
											<motion.div
												key={item.id}
												variants={{
													hidden: { opacity: 0, x: -10 },
													show: { opacity: 1, x: 0 }
												}}
											>
												<SearchItem
													{...item as any}
													active={activeIndex === i}
													queryTerms={[debouncedWord]}
													onMouseMove={() => !isKeyboardMode && setActiveIndex(i)}
												/>
											</motion.div>
										))}
									</motion.menu>
								)}
							</motion.div>
						</AnimatePresence>

						{results.length > 0 && (
							<div className={styles.footer}>
								<span className={styles.tip}>
									<Key code="ArrowUp" /> <Key code="ArrowDown" /> 切换
								</span>
								<span className={styles.tip}>
									<Key code="Enter" /> 选择
								</span>
								<span className={styles.tip}>
									<Key code="Escape" /> 关闭
								</span>
							</div>
						)}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
