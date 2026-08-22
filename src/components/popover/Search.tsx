'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from '@/lib/compat-navigation'
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
	const listResultRef = useRef<HTMLMenuElement>(null)

	// 中文分词支持
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
			boost: { title: 3, titles: 2 },
		},
		processTerm: segmenter
			? term => Array.from(segmenter.segment(term), (seg: any) => seg.segment.toLowerCase())
			: undefined,
	}), [segmenter])

	useEffect(() => {
		const controller = new AbortController()
		fetch('/api/search.json', { signal: controller.signal, cache: 'no-store' })
			.then(res => {
				if (!res.ok) return fetch('/api/search', { signal: controller.signal, cache: 'no-store' })
				return res
			})
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

	// Debounce 关键词
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedWord(word), 150)
		return () => clearTimeout(timer)
	}, [word])

	useEffect(() => {
		if (isOpen) {
			setTimeout(() => {
				inputRef.current?.focus()
				inputRef.current?.select()
			}, 50)
		}
	}, [isOpen])

	const result = useMemo(() => {
		if (!debouncedWord) return []
		return miniSearch.search(debouncedWord)
	}, [debouncedWord, miniSearch])

	const queryTerms = useMemo(() => {
		if (!debouncedWord) return []
		if (segmenter) {
			return Array.from(segmenter.segment(debouncedWord), (s: any) => s.segment.trim()).filter(Boolean)
		}
		return [debouncedWord]
	}, [debouncedWord, segmenter])

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

	const updateActiveIndex = useCallback((index: number, isKeyboard = false) => {
		inputRef.current?.focus()
		if (index < 0 || index >= result.length) return
		setActiveIndex(index)
		if (isKeyboard) setIsKeyboardMode(true)
		const activeItem = listResultRef.current?.children[index] as HTMLElement
		if (activeItem && isKeyboard) {
			activeItem.scrollIntoView({ block: 'nearest' })
		}
	}, [result.length])

	const openActiveItem = useCallback(() => {
		const item = result[activeIndex]
		if (item) {
			router.push(item.id as string)
			setIsOpen(false)
		}
	}, [activeIndex, result, router, setIsOpen])

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			updateActiveIndex(activeIndex + 1, true)
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			updateActiveIndex(activeIndex - 1, true)
		} else if (e.key === 'Enter') {
			e.preventDefault()
			openActiveItem()
		} else if (e.key === 'Escape') {
			e.preventDefault()
			setIsOpen(false)
		}
	}

	if (!isOpen) return null

	return (
		<div className={styles.modalBackdrop} onClick={() => setIsOpen(false)}>
			<div className={`${styles.blogSearch} blog-search`} onClick={e => e.stopPropagation()}>
				<form className={styles.input} onSubmit={e => e.preventDefault()}>
					<Icon icon={status === 'pending' ? 'line-md:loading-alt-loop' : 'tabler:search'} />
					<input
						ref={inputRef}
						value={word}
						onChange={e => setWord(e.target.value)}
						onKeyDown={handleKeyDown}
						type="search"
						className={styles.searchInput}
						placeholder="键入开始搜索"
					/>
				</form>

				{debouncedWord && status === 'success' && !result.length && (
					<div className={styles.noResult}>
						无结果
					</div>
				)}

				{result.length > 0 && (
					<menu
						ref={listResultRef}
						key={result.length < 5 ? result.length : result[0]?.id}
						className={`${styles.searchResult} scrollcheck-y`}
					>
						{result.map((item, itemIndex) => (
							<SearchItem
								key={item.id}
								{...item as any}
								active={activeIndex === itemIndex}
								queryTerms={queryTerms}
								onMouseMove={() => !isKeyboardMode && setActiveIndex(itemIndex)}
								onClick={() => setIsOpen(false)}
							/>
						))}
					</menu>
				)}

				{result.length > 0 && (
					<div className={styles.tip} onClick={() => inputRef.current?.focus()}>
						<Key code="ArrowUp" prevent onPress={() => updateActiveIndex(activeIndex - 1, true)} />
						<Key code="ArrowDown" prevent onPress={() => updateActiveIndex(activeIndex + 1, true)} />
						<span>切换&emsp;</span>
						<Key code="Enter" icon onPress={openActiveItem} />
						<span>选择&emsp;</span>
						<Key code="Escape" icon={false} onPress={() => setIsOpen(false)} />
						<span>关闭</span>
					</div>
				)}
			</div>
		</div>
	)
}
