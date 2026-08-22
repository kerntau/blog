export interface PostMeta {
	path: string
	relativePath: string
	slug: string
	title: string
	description?: string
	date?: string
	updated?: string
	categories?: string[]
	tags?: string[]
	type?: string
	draft?: boolean
	permalink?: string
	wordCount: number
	readingMinutes: number
	image?: string
}

export interface PostDetail {
	path: string
	relativePath: string
	frontmatter: Record<string, any>
	content: string
}

export interface StatsData {
	postCount: number
	totalWords: number
	categoryCount: number
	tagCount: number
	friendCount: number
	categories: Record<string, number>
	tags: Record<string, number>
	years: Record<string, number>
	lastUpdated: string
}

export interface FeedItem {
	id?: string
	author: string
	sitenick?: string
	title?: string
	desc?: string
	link: string
	feed?: string
	icon?: string
	avatar?: string
	archs?: string[]
	date?: string
	comment?: string
}

export interface FeedGroup {
	name: string
	desc?: string
	entries: FeedItem[]
}

export interface SniffResult {
	success: boolean
	url: string
	title?: string
	desc?: string
	icon?: string
	avatar?: string
	feed?: string
	archs?: string[]
	error?: string
}

export interface FeedCheckResult {
	link: string
	status: number
	ok: boolean
	timeMs?: number
	error?: string
}

export interface AssetFile {
	name: string
	path: string
	size: number
	mtime: string
}

export interface AssetReferenceData {
	count: number
	posts: Array<{
		title: string
		path: string
		relativePath: string
	}>
}

export interface GitStatusData {
	isGit: boolean
	hasChanges: boolean
	changes: Array<{ status: string, file: string }>
	recentCommits: string[]
	error?: string
}

export interface HealthData {
	status: 'online'
	uptimeSeconds: number
	nodeVersion: string
	port: number
	rootDir: string
}

export interface ValidationResult {
	valid: boolean
	message?: string
	error?: string
	line?: number
	column?: number
}
