import React, { forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import Image from '@/components/util/Image'
import UtilLink from '../util/UtilLink'
import UtilDate from '../util/UtilDate'
import type { ArticleProps } from '../../types/article'
import { isTimeDiffSignificant } from '../../utils/time'
import { getCategoryColor, getCategoryIcon } from '../../utils/article'
import { formatNumber } from '../../utils/str'
import styles from './PostArticle.module.scss'

interface PostArticleProps extends ArticleProps {
	useUpdated?: boolean
	to?: string
	style?: React.CSSProperties
	priority?: boolean
}

export default forwardRef<HTMLAnchorElement, PostArticleProps>(({
	title,
	description,
	date,
	updated,
	categories,
	readingTime,
	image,
	useUpdated,
	to,
	style,
	priority,
}, ref) => {
	const navigate = useNavigate()
	const showAllDate = isTimeDiffSignificant(date, updated)

	const categoryStr = categories?.[0]
	const catColor = getCategoryColor(categoryStr)
	const catIcon = getCategoryIcon(categoryStr)

	const handleCategoryClick = (e: React.MouseEvent) => {
		if (!categoryStr) return
		e.preventDefault()
		e.stopPropagation()
		navigate(`/categories?category=${encodeURIComponent(categoryStr)}`)
	}

	return (
		<UtilLink ref={ref} to={to} className={`${styles.articleCard} card upraise`} style={style}>
			{image && (
				<Image
					className={`${styles.articleCover} article-cover`}
					src={image}
					alt={title || ''}
					fill
					sizes="(max-width: 768px) 100vw, 40vw"
					priority={priority}
					unoptimized
				/>
			)}
			<article className={styles.articleBody}>
				<h2 className={styles.articleTitle + ' text-creative'}>{title}</h2>

				{description && (
					<p className={styles.articleDescription}>{description}</p>
				)}

				<div className={styles.articleInfo}>
					{date && (showAllDate || !useUpdated) && (
						<UtilDate date={date} icon="tabler:pencil-minus" />
					)}

					{updated && (showAllDate || useUpdated) && (
						<UtilDate
							className={useUpdated ? styles.useUpdated : ''}
							date={updated}
							icon="tabler:clock-edit"
						/>
					)}

					{categoryStr && (
						<span
							style={{ color: catColor, cursor: 'pointer', zIndex: 2 }}
							onClick={handleCategoryClick}
							title={`查看《${categoryStr}》分类`}
						>
							<Icon icon={catIcon} />
							{categoryStr}
						</span>
					)}

					{readingTime?.words && (
						<span className={styles.articleWords}>
							<Icon icon="tabler:pilcrow" />
							{formatNumber(readingTime.words)}字
						</span>
					)}
				</div>
			</article>
		</UtilLink>
	)
})
