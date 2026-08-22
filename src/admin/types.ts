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

export interface PostCompileResult {
	compiledCode: string
	toc: Array<{ depth: number, text: string, id: string }>
}

export interface PostSnapshot {
	fileName: string
	slug: string
	filePath: string
	timestamp: string
	remark: string
	frontmatter: Record<string, any>
	content: string
}

export interface StatsData {
	postCount: number
	publishedCount: number
	draftCount: number
	totalWords: number
	categoryCount: number
	tagCount: number
	friendCount: number
	categories: Record<string, number>
	tags: Record<string, number>
	years: Record<string, number>
	lastUpdated: string
}

export interface CategoryItem {
	name: string
	icon: string
	color: string
	count: number
	posts: Array<{ title: string, path: string, slug: string }>
}

export interface TagItem {
	name: string
	count: number
	posts: Array<{ title: string, path: string, slug: string }>
}

export interface NavItemConfig {
	icon: string
	text: string
	url: string
}

export interface NavGroupConfig {
	title: string
	items: NavItemConfig[]
}

export interface NavConfigData {
	nav: NavGroupConfig[]
	footerNav: NavGroupConfig[]
	iconNav: NavItemConfig[]
}

export interface WidgetItem {
	id: string
	name: string
	icon: string
	description: string
}

export interface TechServiceItem {
	label: string
	value: string
	icon?: string
	iconColor?: string
}

export interface TechStackItem {
	name: string
	version: string
	icon: string
	iconColor?: string
}

export interface WidgetTechConfig {
	title: string
	services: TechServiceItem[]
	techstack: TechStackItem[]
}

export interface WidgetCommGroupConfig {
	title: string
	groupName: string
	account: string
	icon: string
	bgImg?: string
}

export interface WidgetLogItem {
	date: string
	content: string
}

export interface WidgetLogConfig {
	title: string
	items: WidgetLogItem[]
}

export interface WidgetConfigData {
	availableWidgets: WidgetItem[]
	pageAsideMappings: {
		home: string[]
		archive: string[]
		post: string[]
		link: string[]
	}
	statsConfig: {
		birthYear?: number
		wordCount?: string
	}
	tech?: WidgetTechConfig
	commGroup?: WidgetCommGroupConfig
	log?: WidgetLogConfig
}

export interface SiteInfoData {
	title: string
	subtitle: string
	description: string
	authorName: string
	authorAvatar: string
	authorEmail: string
	authorHomepage: string
	url: string
	favicon: string
	timeEstablished: string
	timeZone: string
	defaultCategory: string
	copyrightAbbr: string
	emojiTail: string[]
	logo: string
}

export interface AppearanceConfigData {
	alert: {
		defaultStyle: 'card' | 'flat'
	}
	codeblock: {
		triggerRows: number
		collapsedRows: number
		enableIndentGuide: boolean
		indent: number
		tabSize: number
	}
	excerpt: {
		animation: boolean
		caret: string
	}
	slide: {
		showTitle: boolean
	}
	pagination: {
		perPage: number
		sortOrder: string
		allowAscending: boolean
	}
	themes?: Record<string, any>
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

export interface AuditLogItem {
	id: string
	timestamp: string
	action: string
	target: string
	details: string
	operator: string
}

export interface IntegrityCheckResult {
	totalPosts: number
	issueCount: number
	healthy: boolean
	issues: Array<{
		type: 'error' | 'warning' | 'info'
		message: string
		target: string
	}>
}

export interface GitStatusData {
	isGit: boolean
	hasChanges: boolean
	changes: Array<{ status: string, file: string }>
	recentCommits: string[]
	branch?: string
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
