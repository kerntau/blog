import React, { forwardRef } from 'react'
import { Icon } from '@iconify/react'
import type { ArticleProps } from '../../types/article'
import UtilLink from '../util/UtilLink'
import UtilDate from '../util/UtilDate'
import { getCategoryColor, getCategoryIcon } from '../../utils/article'
import { isSameUnit, isTimeDiffSignificant } from '../../utils/time'
import styles from './PostArchive.module.scss'

interface PostArchiveProps extends ArticleProps {
	showCategory?: boolean
	useUpdated?: boolean
	style?: React.CSSProperties
}

export default forwardRef<HTMLLIElement, PostArchiveProps>((props, ref) => {
	const { title, path, categories, tags, description, showCategory, useUpdated, style } = props
	const mainDate = useUpdated ? props.updated : props.date
	const category = categories?.[0]

	return (
		<li ref={ref} className={styles.articleItem} style={style}>
			<UtilDate className={`${styles.dimHover} dim-hover`} date={mainDate} format="monthDay" />

			<div className="gradient-card" style={{ '--c-accent': getCategoryColor(category) } as React.CSSProperties}>
				<UtilLink className={`${styles.articleLink} scrollbar-hidden scrollcheck-x`} to={path} title={description}>
					<span className={styles.articleTitle}>
						{showCategory && (
							<>
								<Icon icon={getCategoryIcon(category)} />{' '}
							</>
						)}
						{title}
					</span>

					{props.date && useUpdated && isTimeDiffSignificant(props.date, props.updated) && (
						<UtilDate
							className={`${styles.dimHover} ${styles.info} dim-hover`}
							date={props.date}
							format={props.updated && isSameUnit(props.date, props.updated, 'year') ? 'monthDay' : 'date'}
						/>
					)}

					{tags && tags.length > 0 && (
						<ul className={`${styles.dimHover} ${styles.info} ${styles.tagList} dim-hover`}>
							{tags.map(tag => <li key={tag}>{tag}</li>)}
						</ul>
					)}
				</UtilLink>
			</div>
		</li>
	)
})
