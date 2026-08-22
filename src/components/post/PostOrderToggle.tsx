'use client'

import { Icon } from '@iconify/react'
import appConfig from '../../app.config'
import { getCategoryIcon } from '../../utils/article'
import ZDropdown from '../partial/ZDropdown'
import type { ArticleOrderType } from '../../types/article'
import styles from './PostOrderToggle.module.scss'

interface PostOrderToggleProps {
	category?: string
	onCategoryChange: (val?: string) => void
	sortOrder: ArticleOrderType
	onSortOrderChange: (val: ArticleOrderType) => void
	isAscending: boolean
	onIsAscendingChange: (val: boolean) => void

	enableAscending?: boolean
	disableAscending?: boolean
	categories?: string[]
	secretDelay?: string
	children?: React.ReactNode
}

export default function PostOrderToggle({
	category,
	onCategoryChange,
	sortOrder,
	onSortOrderChange,
	isAscending,
	onIsAscendingChange,
	enableAscending,
	disableAscending,
	categories,
	secretDelay,
	children,
}: PostOrderToggleProps) {
	const orderMap = appConfig.article.order
	const allowAscending = appConfig.pagination.allowAscending ? !disableAscending : enableAscending

	function toggleOrder() {
		const orderKeys = Object.keys(orderMap) as ArticleOrderType[]
		const nextIndex = (orderKeys.indexOf(sortOrder) + 1) % orderKeys.length
		onSortOrderChange(orderKeys[nextIndex] || 'date')
	}

	function toggleDirection() {
		if (!allowAscending) return
		onIsAscendingChange(!isAscending)
	}

	return (
		<div className={styles.orderToggle} style={{ '--secret-delay': secretDelay } as React.CSSProperties}>
			{children}

			<ZDropdown
				tabIndex={0}
				content={({ hide }) => (
					<>
						<button
							className={!category ? 'active' : ''}
							onClick={() => {
								hide()
								onCategoryChange(undefined)
							}}
						>
							<Icon icon={getCategoryIcon()} />
							<span>全部分类</span>
						</button>
						{categories?.map((item) => (
							<button
								key={item}
								className={item === category ? 'active' : ''}
								onClick={() => {
									hide()
									onCategoryChange(item)
								}}
							>
								<Icon icon={getCategoryIcon(item)} />
								<span>{item}</span>
							</button>
						))}
					</>
				)}
			>
				<button disabled={!categories}>
					<Icon icon={getCategoryIcon(category)} />
					<span>{category ?? '全部分类'}</span>
				</button>
			</ZDropdown>

			<span>
				{allowAscending && (
					<button aria-label="切换排序方向" onClick={toggleDirection}>
						<Icon icon="tabler:sort-descending" className={`${styles.toggleDirection} ${isAscending ? styles.ascending : ''}`} />
					</button>
				)}

				<button onClick={toggleOrder}>
					{!allowAscending && <Icon icon="tabler:sort-descending" />}
					<span>{(orderMap as any)[sortOrder] || sortOrder}</span>
				</button>
			</span>
		</div>
	)
}
