import type {
	AssetFile,
	AssetReferenceData,
	FeedCheckResult,
	FeedGroup,
	FeedItem,
	GitStatusData,
	HealthData,
	PostDetail,
	PostMeta,
	SniffResult,
	StatsData,
	ValidationResult,
} from './types'

// 本地开发代理到 /api，如果独立访问可通过 http://localhost:3001
const API_BASE = '/api'

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
	const res = await fetch(`${API_BASE}${url}`, {
		headers: {
			'Content-Type': 'application/json',
			...(options.headers || {}),
		},
		...options,
	})

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
	validatePostMdx: (content: string) =>
		request<ValidationResult>('/posts/validate', {
			method: 'POST',
			body: JSON.stringify({ content }),
		}),
	openVsCode: (postPath?: string) =>
		request<{ message: string }>('/posts/open-vscode', {
			method: 'POST',
			body: JSON.stringify({ path: postPath }),
		}),

	// 友链管理
	getFeeds: () => request<FeedGroup[]>('/feeds'),
	saveFeeds: (groups: FeedGroup[]) =>
		request<{ message: string }>('/feeds/save', {
			method: 'POST',
			body: JSON.stringify({ groups }),
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

	// 系统与运维
	getGitStatus: () => request<GitStatusData>('/system/git'),
	createBuildEventSource: () => {
		return new EventSource(`${API_BASE}/system/build-stream`)
	},
}
