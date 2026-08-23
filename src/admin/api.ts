import type {
	AssetFile,
	AssetReferenceData,
	AuditLogItem,
	CategoryItem,
	FeedCheckResult,
	FeedGroup,
	FeedItem,
	GitStatusData,
	HealthData,
	IntegrityCheckResult,
	NavConfigData,
	PostCompileResult,
	PostDetail,
	PostMeta,
	PostSnapshot,
	SniffResult,
	StatsData,
	TagItem,
	ValidationResult,
	WidgetConfigData,
	SiteInfoData,
	AppearanceConfigData,
} from './types'

const API_BASE = '/api'

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
	let res: Response
	try {
		res = await fetch(`${API_BASE}${url}`, {
			headers: {
				'Content-Type': 'application/json',
				...(options.headers || {}),
			},
			...options,
		})
	} catch (networkErr: any) {
		throw new Error(`无法连接到后台管理服务 (${networkErr.message || '网络连接失败'})，请确认后台服务已启动`)
	}

	if (!res.ok) {
		const errData = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
		throw new Error(errData.message || `请求失败: ${res.status}`)
	}

	const json = await res.json()
	if (json.code !== undefined && json.code !== 0) {
		throw new Error(json.message || '请求处理异常')
	}
	return json.data !== undefined ? json.data : json
}

export const adminApi = {
	// 服务健康与心跳探测
	getHealth: () => request<HealthData>('/health'),

	// 统计数据
	getStats: () => request<StatsData>('/stats'),

	// 文章管理
	getPosts: () => request<PostMeta[]>('/posts'),
	getPostDetail: (postPath: string) => request<PostDetail>(`/posts/detail?path=${encodeURIComponent(postPath)}`),
	savePost: (postPath: string, frontmatter: any, content: string) =>
		request<{ path: string, updated: string }>('/posts/save', {
			method: 'POST',
			body: JSON.stringify({ path: postPath, frontmatter, content }),
		}),
	createPost: (params: {
		title: string
		slug?: string
		category?: string
		tags?: string[]
		type?: string
		year?: string
		permalink?: string
		description?: string
		content?: string
	}) =>
		request<{ path: string, relativePath: string, slug: string }>('/posts/create', {
			method: 'POST',
			body: JSON.stringify(params),
		}),
	deletePost: (postPath: string) =>
		request<{ message: string }>('/posts/delete', {
			method: 'POST',
			body: JSON.stringify({ path: postPath }),
		}),
	batchPosts: (params: {
		action: 'category' | 'draft' | 'delete'
		paths: string[]
		category?: string
		draft?: boolean
	}) =>
		request<{ modifiedCount: number }>('/posts/batch', {
			method: 'POST',
			body: JSON.stringify(params),
		}),
	compilePostMdx: (content: string, title?: string) =>
		request<PostCompileResult>('/posts/compile', {
			method: 'POST',
			body: JSON.stringify({ content, title }),
		}),
	validatePostMdx: (content: string) =>
		request<ValidationResult>('/posts/validate', {
			method: 'POST',
			body: JSON.stringify({ content }),
		}),
	getPostHistory: (slug: string) =>
		request<PostSnapshot[]>(`/posts/history?slug=${encodeURIComponent(slug)}`),
	restorePostHistory: (slug: string, snapshotFileName: string) =>
		request<PostSnapshot>('/posts/history/restore', {
			method: 'POST',
			body: JSON.stringify({ slug, snapshotFileName }),
		}),
	openVsCode: (postPath?: string) =>
		request<{ message: string }>('/posts/open-vscode', {
			method: 'POST',
			body: JSON.stringify({ path: postPath }),
		}),

	// 分类与标签管理
	getCategories: () => request<CategoryItem[]>('/categories'),
	saveCategories: (categories: Array<{ name: string, icon: string, color: string }>) =>
		request<{ message: string }>('/categories/save', {
			method: 'POST',
			body: JSON.stringify({ categories }),
		}),
	getTags: () => request<TagItem[]>('/tags'),
	renameTag: (oldName: string, newName: string) =>
		request<{ message: string }>('/tags/rename', {
			method: 'POST',
			body: JSON.stringify({ oldName, newName }),
		}),

	// 导航管理
	getNav: () => request<NavConfigData>('/nav'),
	saveNav: (data: { nav?: any[], footerNav?: any[], iconNav?: any[] }) =>
		request<{ message: string }>('/nav/save', {
			method: 'POST',
			body: JSON.stringify(data),
		}),

	// 挂件管理
	getWidgets: () => request<WidgetConfigData>('/widgets'),
	saveWidgets: (data: any) =>
		request<{ message: string }>('/widgets/save', {
			method: 'POST',
			body: JSON.stringify(data),
		}),

	// 站点身份与品牌工坊
	getSiteInfo: () => request<SiteInfoData>('/site-info'),
	saveSiteInfo: (data: Partial<SiteInfoData>) =>
		request<{ message: string }>('/site-info/save', {
			method: 'POST',
			body: JSON.stringify(data),
		}),

	// 主题外观与排版工坊
	getAppearance: () => request<AppearanceConfigData>('/appearance'),
	saveAppearance: (data: Partial<AppearanceConfigData>) =>
		request<{ message: string }>('/appearance/save', {
			method: 'POST',
			body: JSON.stringify(data),
		}),

	// 友链管理
	getFeeds: () => request<FeedGroup[]>('/feeds'),
	saveFeeds: (groups: FeedGroup[]) =>
		request<{ message: string }>('/feeds/save', {
			method: 'POST',
			body: JSON.stringify({ groups }),
		}),
	getMyFeed: () =>
		request<{
			author: string
			sitenick: string
			title: string
			desc: string
			link: string
			avatar: string
			archs: string[]
			date: string
			comment: string
		}>('/feeds/my-feed'),
	saveMyFeed: (data: {
		author?: string
		sitenick?: string
		title?: string
		desc?: string
		link?: string
		avatar?: string
		archs?: string[]
		comment?: string
	}) =>
		request<{ message: string }>('/feeds/my-feed/save', {
			method: 'POST',
			body: JSON.stringify(data),
		}),
	getLinkMd: () => request<{ content: string }>('/feeds/link-md'),
	saveLinkMd: (content: string) =>
		request<{ message: string }>('/feeds/link-md/save', {
			method: 'POST',
			body: JSON.stringify({ content }),
		}),
	sniffWebsite: (url: string) =>
		request<SniffResult>('/feeds/sniff', {
			method: 'POST',
			body: JSON.stringify({ url }),
		}),
	checkFeeds: (links: string[]) =>
		request<FeedCheckResult[]>('/feeds/check', {
			method: 'POST',
			body: JSON.stringify({ links }),
		}),
	importOpml: (opmlContent: string) =>
		request<{ entries: FeedItem[] }>('/feeds/import-opml', {
			method: 'POST',
			body: JSON.stringify({ opmlContent }),
		}),

	// 配置管理
	getConfig: () =>
		request<{ blogConfigRaw: string, appConfigRaw: string }>('/config'),
	saveConfig: (params: { blogConfigRaw?: string, appConfigRaw?: string }) =>
		request<{ message: string }>('/config/save', {
			method: 'POST',
			body: JSON.stringify(params),
		}),

	// 资产管理
	getAssets: () => request<AssetFile[]>('/assets'),
	getAssetReferences: (assetPath: string) =>
		request<AssetReferenceData>('/assets/references', {
			method: 'POST',
			body: JSON.stringify({ assetPath }),
		}),
	uploadAsset: (fileName: string, base64: string, folder?: string) =>
		request<{ path: string }>('/assets/upload', {
			method: 'POST',
			body: JSON.stringify({ fileName, base64, folder }),
		}),
	deleteAsset: (assetPath: string) =>
		request<{ message: string }>('/assets/delete', {
			method: 'POST',
			body: JSON.stringify({ path: assetPath }),
		}),

	// 系统与备份与审计
	getAuditLogs: () => request<AuditLogItem[]>('/system/audit-logs'),
	getBackup: () => request<any>('/system/backup'),
	restoreBackup: (backup: any) =>
		request<{ message: string }>('/system/restore', {
			method: 'POST',
			body: JSON.stringify({ backup }),
		}),
	checkIntegrity: () => request<IntegrityCheckResult>('/system/integrity-check'),
	getGitStatus: () => request<GitStatusData>('/system/git'),
	createBuildEventSource: () => {
		return new EventSource(`${API_BASE}/system/build-stream`)
	},
}
