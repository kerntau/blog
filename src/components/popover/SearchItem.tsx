import { Icon } from '@iconify/react'
import UtilLink from '../util/UtilLink'
import styles from './SearchItem.module.scss'

interface SearchItemProps {
	id: string
	title: string
	content: string
	titles?: string[]
	level?: number
	queryTerms?: string[]
	active?: boolean
	onMouseMove?: () => void
}

function highlightHtml(text: string, terms?: string[]) {
	if (!terms || !terms.length) return text
	const regex = new RegExp(`(${terms.join('|')})`, 'gi')
	return text.replace(regex, '<mark>$1</mark>')
}

export default function SearchItem(props: SearchItemProps) {
	const { id, title, content, titles = [], level, queryTerms, active, onMouseMove } = props

	return (
		<UtilLink
			to={id}
			className={`${styles.searchItem} ${active ? styles.active : ''}`}
			onMouseMove={onMouseMove}
		>
			<hgroup className={`${styles.hgroup} text-creative`}>
				{[...titles, title].map((heading, i) => (
					<span
						key={i}
						className={styles.title}
						dangerouslySetInnerHTML={{ __html: highlightHtml(heading, queryTerms) }}
					/>
				))}
				{level === 1 && <Icon icon="tabler:file-text" className={styles.fileIcon} />}
			</hgroup>
			{content && (
				<p
					className={styles.content}
					dangerouslySetInnerHTML={{ __html: highlightHtml(content, queryTerms) }}
				/>
			)}
		</UtilLink>
	)
}
