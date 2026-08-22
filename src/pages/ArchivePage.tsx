import { useState, useMemo, useEffect, useRef } from 'react'
import { groupBy } from 'es-toolkit/array'
import { sumBy } from 'es-toolkit/math'
import { mapValues } from 'es-toolkit/object'
import { getPostsByStemPrefix } from '@/lib/content'
import { useArticleSort, useCategory } from '@/hooks/useArticle'
import { useAvoidTarget } from '@/hooks/useAvoid'
import { useLayoutStore } from '@/stores/layout'
import PostOrderToggle from '@/components/post/PostOrderToggle'
import PostArchive from '@/components/post/PostArchive'
import ZSecret from '@/components/partial/ZSecret'
import ZToggle from '@/components/partial/ZToggle'
import ZSlider from '@/components/partial/ZSlider'
import BlogHeader from '@/components/blog/BlogHeader'
import appConfig from '@/app.config'
import { toZonedTemporal } from '@/utils/time'
import { getFixedDelay } from '@/utils/anim'
import { formatNumber } from '@/utils/str'
import styles from './ArchivePage.module.scss'

export default function ArchivePage() {
	const allPosts = useMemo(() => getPostsByStemPrefix('posts/'), [])
	const setAside = useLayoutStore(s => s.setAside)

	useEffect(() => {
		setAside(['blog-stats', 'blog-log'])
	}, [setAside])

	const [showTuning, setShowTuning] = useState(false)
	const [spacing, setSpacing] = useState(0)
	const [column, setColumn] = useState(1)
	const tuningRef = useRef<HTMLDivElement>(null)

	useAvoidTarget(tuningRef, showTuning)

	const { listSorted, isAscending, sortOrder, setSortOrder, setIsAscending } = useArticleSort(allPosts)
	const { category, setCategory, categories, listCategorized } = useCategory(listSorted)

	const birthYear = appConfig.component.stats.birthYear

	const listGrouped = useMemo(() => {
		const groups = groupBy(listCategorized, (article) => {
			try {
				const d = (sortOrder === 'updated' ? article.updated : article.date) || ''
				return toZonedTemporal(d).year.toString()
			} catch {
				return ''
			}
		})
		const entries = Object.entries(groups).filter(([year]) => !!year)
		return isAscending ? entries : entries.reverse()
	}, [listCategorized, sortOrder, isAscending])

	const yearlyWordCount = useMemo(() => {
		return mapValues(Object.fromEntries(listGrouped), (articles) => {
			const total = sumBy(articles, a => a.readingTime?.words ?? 0)
			return formatNumber(total)
		})
	}, [listGrouped])

	return (
		<>
			<div className="mobile-only">
				<BlogHeader as="h1" />
			</div>

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
					<div ref={tuningRef} className={`${styles.archiveTuning} card`}>
						<ZSlider
							label="间距"
							value={spacing}
							onChange={setSpacing}
							springMin={-0.4}
							springMax={0.1}
							list={['-0.3', '0']}
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
		</>
	)
}
