'use client'

import { Icon } from '@iconify/react'
import type { ArticleProps } from '../../types/article'
import appConfig from '../../app.config'
import useCopy from '../../hooks/useCopy'
import UtilDate from '../util/UtilDate'
import UtilLink from '../util/UtilLink'
import ZButton from '../partial/ZButton'
import Pic from '../content/Pic'
import { isTimeDiffSignificant } from '../../utils/time'
import { getCategoryIcon, getPostTypeClassName } from '../../utils/article'
import { formatNumber } from '../../utils/str'
import styles from './PostHeader.module.scss'

export default function PostHeader(props: ArticleProps) {
	const { image, title, date, updated, categories, readingTime, type, meta, path } = props

	const shareText = `【${appConfig.title}】${title}\n\n${
		props.description ? `${props.description}\n\n` : ''}${
		new URL(path || '', appConfig.url).href}`

	const { isCopied, copy } = useCopy(shareText)

	const coverFilter = meta?.coverFilter || (meta?.coverDim ? 'brightness(0.75)' : undefined)

	return (
		<div className={`${styles.postHeader} ${image ? styles.hasCover : ''}`}>
			{image && <Pic className={styles.postCover} src={image} alt={title} filter={coverFilter} />}
			
			<div className={styles.postNav}>
				<div className={styles.operations}>
					<ZButton
						icon={isCopied ? 'tabler:check' : 'tabler:share'}
						text="文字分享"
						onClick={copy}
					/>
				</div>

				{!meta?.hideInfo && (
					<div className={styles.postInfo}>
						{date && (
							<UtilDate
								date={date}
								icon="tabler:pencil-minus"
							/>
						)}

						{updated && isTimeDiffSignificant(date || '', updated, 1) && (
							<UtilDate
								date={updated}
								icon="tabler:clock-edit"
							/>
						)}

						{categories && categories.length > 0 && (
							<UtilLink
								to={`/categories?category=${encodeURIComponent(categories[0])}`}
								style={{ color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4 }}
								title={`查看《${categories[0]}》分类全部文章`}
							>
								<Icon icon={getCategoryIcon(categories[0])} />
								{categories[0]}
							</UtilLink>
						)}

						<span>
							<Icon icon="tabler:pilcrow" />
							{formatNumber(readingTime?.words)} 字
						</span>
					</div>
				)}
			</div>

			<h1 className={`${styles.postTitle} ${getPostTypeClassName(type)}`}>
				{title}
			</h1>
		</div>
	)
}
