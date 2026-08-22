import type { ReadTimeResults } from 'reading-time'
import type { MetaSlotsTree } from '../../remark-plugins/rehype-meta-slots'
import blogConfig from '../../blog.config'

export type ArticleOrderType = keyof typeof blogConfig.article.order

export interface ArticleSchema {
	title?: string
	description?: string
	date?: string
	updated?: string
	published?: string
	categories?: string[]
	tags?: string[]
	type?: string

	image?: string
	recommend?: number
	references?: { title?: string, link?: string }[]
	/** TODO */
	draft?: boolean
	permalink?: string

	readingTime?: ReadTimeResults
}

export interface ArticleProps extends ArticleSchema {
	path: string

	meta?: {
		coverDim?: boolean
		coverFilter?: string
		hideInfo?: boolean
		slots?: Record<string, MetaSlotsTree>
		aside?: string[]
	}
}
