import React, { forwardRef } from 'react'
import { Icon } from '@iconify/react'
import type { ArticleProps } from '../../types/article'
import UtilLink from '../util/UtilLink'
import UtilDate from '../util/UtilDate'
import { isTimeDiffSignificant, isSameUnit } from '../../utils/time'
import appConfig from '../../app.config'
import styles from './PostArchive.module.scss'

interface PostArchiveProps extends ArticleProps {
	showCategory?: boolean
	useUpdated?: boolean
	style?: React.CSSProperties
	to?: string
}

export default forwardRef<HTMLLIElement, PostArchiveProps>((props, ref) => {
	const { title, description, path, date, updated, categories, tags, showCategory = true, useUpdated, style, to } = props
	const targetPath = to || path || ''
	const mainDate = useUpdated ? updated : date

	const categoryStr = categories?.[0]
	const catConfig = categoryStr ? appConfig.article.categories?.[categoryStr as keyof typeof appConfig.article.categories] : null
	const catColor = catConfig?.color
	const catIcon = catConfig?.icon || (categoryStr ? (appConfig.article.categories?.[appConfig.defaultCategory as keyof typeof appConfig.article.categories]?.icon || 'tabler:circle-dashed') : undefined)

	return (
		<li ref={ref} className={styles.articleItem} style={style}>
			<UtilDate className={`${styles.dimHover} dim-hover`} date={mainDate} format="monthDay" />

			<div
				className="gradient-card"
				style={{ '--c-accent': catColor } as React.CSSProperties}
			>
				<UtilLink
					className={`${styles.articleLink} scrollbar-hidden scrollcheck-x`}
					to={targetPath}
					title={description}
				>
					<span className={styles.articleTitle}>
						{showCategory && catIcon && (
							<Icon icon={catIcon} />
						)}
						{title}
					</span>

					{date && useUpdated && isTimeDiffSignificant(date, updated) && (
						<UtilDate
							className={`${styles.dimHover} dim-hover ${styles.info}`}
							date={date}
							format={updated && isSameUnit(date, updated, 'year') ? 'monthDay' : 'date'}
						/>
					)}

					{tags && tags.length > 0 && (
						<ul className={`${styles.dimHover} dim-hover ${styles.info} ${styles.tagList}`}>
							{tags.map(tag => (
								<li key={tag}>{tag}</li>
							))}
						</ul>
					)}
				</UtilLink>
			</div>
		</li>
	)
})
