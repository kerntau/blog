'use client'

import { useState, useMemo, useEffect } from 'react'
import { groupBy } from 'es-toolkit/array'
import { sumBy } from 'es-toolkit/math'
import { mapValues } from 'es-toolkit/object'
import { useArticleSort, useCategory } from '../../hooks/useArticle'
import PostOrderToggle from '../../components/post/PostOrderToggle'
import PostArchive from '../../components/post/PostArchive'
import ZSecret from '../../components/partial/ZSecret'
import ZToggle from '../../components/partial/ZToggle'
import ZSlider from '../../components/partial/ZSlider'
import UtilHydrateSafe from '../../components/util/UtilHydrateSafe'
import appConfig from '../../app.config'
import { toZonedTemporal } from '../../utils/time'
import type { ArticleProps } from '../../types/article'
import { useLayoutStore } from '../../stores/layout'
import { getFixedDelay } from '../../utils/anim'
import styles from './Archive.module.scss'

export default function ArchiveClient({ allPosts }: { allPosts: ArticleProps[] }) {
	const setAside = useLayoutStore(s => s.setAside)
	useEffect(() => {
		setAside(['blog-stats', 'blog-log'])
	}, [setAside])

	const [showTuning, setShowTuning] = useState(false)
	const [spacing, setSpacing] = useState(0)
	const [column, setColumn] = useState(1)

	const { listSorted, isAscending, sortOrder, setSortOrder, setIsAscending } = useArticleSort(allPosts)
	const { category, setCategory, categories, listCategorized } = useCategory(listSorted)

	const birthYear = appConfig.component.stats.birthYear

	const listGrouped = useMemo(() => {
		const groups = groupBy(listCategorized, (article) => {
			try {
				const d = (sortOrder === 'updated' ? article.updated : article.date) || ''
				return toZonedTemporal(d).year.toString()
			} catch {
				return 'Unknown'
			}
		})
		const entries = Object.entries(groups)
		return isAscending ? entries : entries.reverse()
	}, [listCategorized, sortOrder, isAscending])

	const yearlyWordCount = useMemo(() => {
		return mapValues(Object.fromEntries(listGrouped), (articles) => {
			const total = sumBy(articles, a => a.readingTime?.words ?? 0)
			return total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toString()
		})
	}, [listGrouped])

	return (
		<UtilHydrateSafe>
			<div className={`${styles.archive} proper-height`}>
				<PostOrderToggle
					isAscending={isAscending}
					onIsAscendingChange={setIsAscending}
					sortOrder={sortOrder}
					onSortOrderChange={setSortOrder}
					category={category}
					onCategoryChange={setCategory}
					categories={categories}
				>
					<ZSecret>
						<ZToggle
							label="密度调节"
							value={showTuning}
							onChange={setShowTuning}
						/>
					</ZSecret>
				</PostOrderToggle>

				{listGrouped.map(([year, yearGroup]) => (
					<section
						key={year}
						className={`${styles.archiveGroup} ${column > 1 ? styles.hideInfo : ''}`}
						style={{
							'--archive-item-gap': `${spacing}em`,
							'--archive-item-column': column,
						} as any}
					>
						<div className={styles.archiveTitle}>
							<h2 className={styles.archiveYear}>{year}</h2>
							<div className={styles.archiveAge}>
								<span>{Number(year) - birthYear}</span>
								<span className={styles.ageLabel}>岁</span>
							</div>
							<div className={styles.archiveInfo}>
								<span>{yearlyWordCount[year]}字</span>
								<span>{yearGroup.length}篇</span>
							</div>
						</div>

						<menu className={styles.archiveList}>
							{yearGroup.map((article, index) => (
								<PostArchive
									key={article.path}
									{...article}
									showCategory={column < 3}
									useUpdated={sortOrder === 'updated'}
									style={getFixedDelay(index * 0.03)}
								/>
							))}
						</menu>
					</section>
				))}

				{showTuning && (
					<div className={`${styles.archiveTuning} card`}>
						<ZSlider
							label="间距"
							value={spacing}
							onChange={setSpacing}
							min={-1}
							max={0.2}
							step={0.1}
						/>
						<ZSlider
							label="列数"
							value={column}
							onChange={setColumn}
							min={1}
							max={8}
						/>
					</div>
				)}
			</div>
		</UtilHydrateSafe>
	)
}
