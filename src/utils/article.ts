import appConfig from '../app.config'

export function getCategoryIcon(category?: string) {
	return appConfig.article.categories[category as keyof typeof appConfig.article.categories]?.icon ?? 'tabler:folder'
}

export function getCategoryColor(category?: string) {
	return appConfig.article.categories[category as keyof typeof appConfig.article.categories]?.color
}

interface GetPostTypeClassNameOptions {
	prefix?: string
}

export function getPostTypeClassName(type = 'tech', options?: GetPostTypeClassNameOptions) {
	const { prefix = 'text' } = options || {}
	return `${prefix}-${type}`
}
