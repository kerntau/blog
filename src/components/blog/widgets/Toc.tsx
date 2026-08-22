'use client'

import { useRef } from 'react'
import { Icon } from '@iconify/react'
import { ZCSSTransition, ZTransitionGroup } from '../../../components/util/ZTransition'
import { useLayoutStore, type TocItem } from '../../../stores/layout'
import { useToc } from '../../../hooks/useToc'
import BlogWidget from '../BlogWidget'
import styles from './Toc.module.scss'

function hasHeading(tocList: TocItem[], headingId?: string, currentIndex?: number): boolean {
	if (!headingId || currentIndex === undefined) return false
	const current = tocList[currentIndex]
	if (current?.id === headingId) return true
	
	// Check if any child of this item is the active heading
	for (let i = currentIndex + 1; i < tocList.length; i++) {
		const item = tocList[i]
		if (item?.depth <= (current?.depth || 0)) break // Reached a sibling or parent
		if (item?.id === headingId) return true
	}
	return false
}

export default function Toc() {
	const toc = useLayoutStore(s => s.toc)
	const scrollableEl = useRef<HTMLElement>(null)
	
	// Since BlogWidget doesn't currently expose its body directly as a ref like Nuxt did,
	// we use a wrapper div inside BlogWidget to track scrolling for scrollToActiveTocItem
	const { tocOffsets, activeHeadingId } = useToc(toc, scrollableEl)

	return (
		<BlogWidget
			title="文章目录"
			shrink
			bodyRef={scrollableEl as any}
			style={{ minHeight: `clamp(4rem, ${tocOffsets.length}rem, 20rem)` }}
			action={(
				<>
					<a href="#main-content" aria-label="返回开头">
						<Icon icon="tabler:arrow-bar-to-up" />
					</a>
					<a href="#twikoo" aria-label="评论区">
						<Icon icon="tabler:message-dots" />
					</a>
				</>
			)}
		>
			{toc && toc.length > 0 ? (
				<ZTransitionGroup component="ol" className={styles.toc}>
						{toc.map((item, index) => {
							const isActive = item.id === activeHeadingId
							const isHasActive = hasHeading(toc, activeHeadingId, index)
							
							return (
								<ZCSSTransition 
									key={item.id || index}
									name="float-in"
									timeout={200}
								>
									<li
										className={`${styles.tocItem} ${isActive ? styles.active : ''} ${isHasActive && !isActive ? styles.hasActive : ''}`}
										style={{
											paddingInlineStart: `${Math.max(0, item.depth - 2) * 1}em`,
											'--delay': `${(index * 0.05).toFixed(2)}s`
										} as React.CSSProperties}
									>
										<a href={`#${item.id}`} title={item.text}>{item.text}</a>
									</li>
								</ZCSSTransition>
							)
						})}
				</ZTransitionGroup>
			) : (
				<p className={styles.noToc}>暂无目录信息</p>
			)}
		</BlogWidget>
	)
}
