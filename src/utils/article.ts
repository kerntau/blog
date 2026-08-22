import appConfig from '../app.config'

export function getCategoryIcon(category?: string) {
	if (!category) return 'tabler:folder'
	return appConfig.article.categories[category as keyof typeof appConfig.article.categories]?.icon ?? 'tabler:folder'
}

export function getCategoryColor(category?: string) {
	if (!category) return undefined
	return appConfig.article.categories[category as keyof typeof appConfig.article.categories]?.color
}

interface GetPostTypeClassNameOptions {
	prefix?: string
}

export function getPostTypeClassName(type = 'tech', options?: GetPostTypeClassNameOptions) {
	const { prefix = 'text' } = options || {}
	return `${prefix}-${type}`
}
