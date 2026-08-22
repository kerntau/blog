'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { getPaginationIndicator } from '../../hooks/usePagination'
import { useAvoidTarget } from '../../hooks/useAvoid'
import ZButton from './ZButton'
import styles from './ZPagination.module.scss'

interface ZPaginationProps {
	page: number
	setPage: (page: number) => void
	totalPages: number
	expandPages?: number
	sticky?: boolean
	avoid?: boolean
}

export default function ZPagination({
	page,
	setPage,
	totalPages,
	expandPages = 2,
	sticky,
	avoid,
}: ZPaginationProps) {
	const pageArr = useMemo(() => getPaginationIndicator(page, totalPages, expandPages), [page, totalPages, expandPages])

	const paginationRef = useRef<HTMLElement>(null)
	const anchorRef = useRef<HTMLDivElement>(null)
	const [expand, setExpand] = useState(false)

	useEffect(() => {
		if (!anchorRef.current) return
		const observer = new IntersectionObserver(([entry]) => {
			setExpand(entry.isIntersecting)
		})
		observer.observe(anchorRef.current)
		return () => observer.disconnect()
	}, [])

	if (avoid) {
		useAvoidTarget(paginationRef as React.RefObject<HTMLElement>, avoid)
	}

	return (
		<>
			<nav
				ref={paginationRef}
				className={`${styles.pagination} ${sticky ? styles.sticky : ''} ${expand ? styles.expand : ''}`}
				aria-label={`第${page}页，共${totalPages}页`}
				style={{ '--collapsed-width': `${pageArr.length * 2 + 6}em` } as React.CSSProperties}
			>
				<ZButton
					disabled={page <= 1}
					className={`${styles.paginationButton} rtl-flip`}
					icon="tabler:arrow-left"
					aria-label="上一页"
					onClick={() => setPage(page - 1)}
				/>
				{pageArr.map((i, idx) => (
					Number.isFinite(i) ? (
						<button
							key={idx}
							className={`${styles.paginationNum} ${i === page ? styles.active : ''}`}
							aria-label={`第${i}页`}
							onClick={() => setPage(i)}
						>
							{i}
						</button>
					) : (
						<button key={idx} disabled className={styles.paginationNum}>
							…
						</button>
					)
				))}
				<ZButton
					disabled={page >= totalPages}
					className={`${styles.paginationButton} rtl-flip`}
					icon="tabler:arrow-right"
					aria-label="下一页"
					onClick={() => setPage(page + 1)}
				/>
			</nav>
			<div ref={anchorRef} />
		</>
	)
}
