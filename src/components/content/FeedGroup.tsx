'use client'

import { useEffect, useState } from 'react'
import { ZCSSTransition, ZTransitionGroup } from '../../components/util/ZTransition'
import type { FeedGroup as FeedGroupType } from '../../types/feed'
import FeedCard from './FeedCard'
import styles from './FeedGroup.module.scss'

interface FeedGroupProps extends FeedGroupType {
	shuffle?: boolean
}

export default function FeedGroup({ name, desc, entries, shuffle }: FeedGroupProps) {
	const [list, setList] = useState(entries)

	useEffect(() => {
		setList(shuffle ? [...entries].sort(() => Math.random() - 0.5) : entries)
	}, [entries, shuffle])

	function getCardDelay(link: string) {
		let hash = 0
		for (const char of link) {
			hash = hash * 31 + char.charCodeAt(0)
		}
		return (hash % 1000) / 1000
	}

	return (
		<section className={styles.feedGroup}>
			<h3 className={styles.feedTitle}>
				{shuffle ? (
					<button
						title="点击随机排序，按住修饰键点击可取消随机排序"
						onClick={(event) => {
							if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
								setList(entries)
							} else {
								setList([...entries].sort(() => Math.random() - 0.5))
							}
						}}
					>
						{name}
					</button>
				) : (
					<span>{name}</span>
				)}
			</h3>
			{desc && <p className={styles.feedDesc}>{desc}</p>}

			<ZTransitionGroup component="menu" className={styles.feedList}>
				{list.map((entry, index) => (
					<ZCSSTransition
						key={entry.link || index}
						name="float-in"
						timeout={200}
					>
						<li style={{ '--delay': `${getCardDelay(entry.link)}s` } as React.CSSProperties}>
							<FeedCard {...entry} />
						</li>
					</ZCSSTransition>
				))}
			</ZTransitionGroup>
		</section>
	)
}
