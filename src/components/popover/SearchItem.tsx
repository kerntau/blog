import { Icon } from '@iconify/react'
import UtilLink from '../util/UtilLink'
import { highlightHtml } from '../../utils/str'
import styles from './SearchItem.module.scss'

interface SearchItemProps {
	id: string
	title: string
	content?: string
	titles?: string[]
	level?: number
	queryTerms?: string[]
	active?: boolean
	onMouseMove?: () => void
	onClick?: () => void
}

export default function SearchItem(props: SearchItemProps) {
	const { id, title = '', content = '', titles = [], level, queryTerms, active, onMouseMove, onClick } = props

	return (
		<UtilLink
			to={id}
			className={`${styles.searchItem} search-item ${active ? `${styles.active} active` : ''}`}
			onMouseMove={onMouseMove}
			onClick={onClick}
		>
			<hgroup className="text-creative">
				{[...titles, title].map((heading, i) => (
					<span
						key={i}
						className={`${styles.title} title`}
						dangerouslySetInnerHTML={{ __html: highlightHtml(heading, queryTerms) }}
					/>
				))}
				{level === 1 && <Icon icon="tabler:file-text" />}
			</hgroup>
			{content && (
				<p
					className={`${styles.content} content`}
					dangerouslySetInnerHTML={{ __html: highlightHtml(content, queryTerms) }}
				/>
			)}
		</UtilLink>
	)
}
