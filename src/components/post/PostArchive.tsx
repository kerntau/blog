import React, { forwardRef } from 'react'
import type { ArticleProps } from '../../types/article'
import UtilLink from '../util/UtilLink'
import styles from './PostArchive.module.scss'

interface PostArchiveProps extends ArticleProps {
	showCategory?: boolean
	useUpdated?: boolean
	style?: React.CSSProperties
	to?: string
}

export default forwardRef<HTMLLIElement, PostArchiveProps>((props, ref) => {
	const { title, path, categories, showCategory = true, useUpdated, style, to } = props
	const date = (useUpdated ? props.updated : props.date) || ''
	const targetPath = to || path || ''

	return (
		<li ref={ref} className={styles.postArchive} style={style}>
			<UtilLink to={targetPath} className={styles.archiveItem}>
				<time className={styles.archiveTime} dateTime={date}>
					{date.slice(5, 10)}
				</time>
				<h3 className={styles.archiveTitle}>{title}</h3>
				{showCategory && categories?.[0] && (
					<span className="dim-hover">{categories[0]}</span>
				)}
			</UtilLink>
		</li>
	)
})
