import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { PostDetail, PostSnapshot } from '../types'
import { MdcSnippetsPicker } from '../components/MdcSnippetsPicker'
import { MarkdownPreview } from '../components/MarkdownPreview'
import { DevicePreviewFrame } from '../components/DevicePreviewFrame'
import { DiffViewerModal } from '../components/DiffViewerModal'
import { AssetPickerModal } from '../components/AssetPickerModal'
import { IconPickerModal } from '../components/IconPickerModal'
import { HistoryVersionModal } from '../components/HistoryVersionModal'
import { useToast } from '../components/Toast'
import { parseArrayField, calculatePostStats } from '../../utils/post-meta'
import { Temporal } from 'temporal-polyfill'

interface PostEditorViewProps {
	postPath?: string
	onBack: () => void
	onSaved?: () => void
}

interface TocItem {
	level: number
	text: string
	lineIndex: number
}

export type EditorLayoutMode = 'split' | 'vertical' | 'editor-only' | 'preview-only'

export const PostEditorView: React.FC<PostEditorViewProps> = ({ postPath, onBack, onSaved }) => {
	const { showToast } = useToast()
	const isNew = !postPath
	const [loading, setLoading] = useState(!isNew)
	const [saving, setSaving] = useState(false)
	const [validating, setValidating] = useState(false)
	const [layoutMode, setLayoutMode] = useState<EditorLayoutMode>('split')

	const [originalRawContent, setOriginalRawContent] = useState('')

	// 表单状态
	const [title, setTitle] = useState('')
	const [slug, setSlug] = useState('')
	const [description, setDescription] = useState('')
	const [category, setCategory] = useState('前端开发')
	const [categoriesList, setCategoriesList] = useState<string[]>([])
	const [tags, setTags] = useState<string[]>([])
	const [tagInput, setTagInput] = useState('')
	const [type, setType] = useState('tech')
	const [image, setImage] = useState('')
	const [permalink, setPermalink] = useState('')
	const [draft, setDraft] = useState(false)
	const [date, setDate] = useState('')
	const [content, setContent] = useState('')
	const [showMeta, setShowMeta] = useState(true)
	const [showToc, setShowToc] = useState(false)
	const [isDirty, setIsDirty] = useState(false)

	// 弹窗状态
	const [showDiffModal, setShowDiffModal] = useState(false)
	const [showAssetPicker, setShowAssetPicker] = useState(false)
	const [showIconPicker, setShowIconPicker] = useState(false)
	const [showHistoryModal, setShowHistoryModal] = useState(false)
	const [hasDraftNotice, setHasDraftNotice] = useState(false)

	const textareaRef = useRef<HTMLTextAreaElement | null>(null)
	const currentSlug = postPath ? postPath.replace(/^.*[\\/]/, '').replace(/\.(md|mdx)$/i, '') : slug || 'new-post'
	const draftStorageKey = `blog_draft_${currentSlug}`

	// 加载系统分类列表
	useEffect(() => {
		adminApi.getCategories()
			.then((cats) => {
				setCategoriesList(cats.map(c => c.name))
			})
			.catch(() => {})
	}, [])

	// 加载文章数据
	useEffect(() => {
		if (postPath) {
			setLoading(true)
			adminApi.getPostDetail(postPath)
				.then((detail: PostDetail) => {
					const fm = detail.frontmatter || {}
					setTitle(fm.title || '')
					setDescription(fm.description || '')
					const parsedCats = parseArrayField(fm.categories)
					setCategory(parsedCats[0] || '前端开发')
					setTags(parseArrayField(fm.tags))
					setType(fm.type || 'tech')
					setImage(fm.image && !fm.image.startsWith('#') ? fm.image : '')
					setPermalink(fm.permalink || '')
					setDraft(Boolean(fm.draft))
					setDate(fm.date ? String(fm.date) : '')
					setContent(detail.content || '')
					setOriginalRawContent(detail.content || '')

					const savedDraft = localStorage.getItem(draftStorageKey)
					if (savedDraft && savedDraft !== detail.content) {
						setHasDraftNotice(true)
					}
				})
				.catch((err: any) => {
					showToast(`加载文章失败: ${err.message}`, 'error')
				})
				.finally(() => {
					setLoading(false)
				})
		}
		else {
			const savedDraft = localStorage.getItem(draftStorageKey)
			if (savedDraft) {
				setHasDraftNotice(true)
			}
		}
	}, [postPath, draftStorageKey, showToast])

	// 自动防抖暂存草稿
	useEffect(() => {
		if (!content) return
		setIsDirty(content !== originalRawContent)
		const timer = setTimeout(() => {
			localStorage.setItem(draftStorageKey, content)
		}, 1500)
		return () => clearTimeout(timer)
	}, [content, originalRawContent, draftStorageKey])

	// 恢复暂存草稿
	const handleRestoreDraft = () => {
		const savedDraft = localStorage.getItem(draftStorageKey)
		if (savedDraft) {
			setContent(savedDraft)
			setHasDraftNotice(false)
			showToast('已恢复本地暂存草稿', 'success')
		}
	}

	// 放弃暂存草稿
	const handleDiscardDraft = () => {
		localStorage.removeItem(draftStorageKey)
		setHasDraftNotice(false)
		showToast('已清理本地暂存草稿', 'info')
	}

	// 保存文章
	const handleSave = useCallback(async (isPublish = false) => {
		if (!title.trim()) {
			showToast('文章标题不能为空', 'warning')
			return
		}

		setSaving(true)

		try {
			if (isNew) {
				await adminApi.createPost({
					title: title.trim(),
					slug: slug.trim() || undefined,
					category: category.trim(),
					tags,
					type,
					permalink: permalink.trim() || undefined,
					description: description.trim() || undefined,
					content,
				})
				localStorage.removeItem(draftStorageKey)
				setIsDirty(false)
				showToast('新建文章成功', 'success')
				setTimeout(() => {
					if (onSaved) onSaved()
					onBack()
				}, 600)
			}
			else {
				const frontmatter: any = {
					title: title.trim(),
					description: description.trim() || undefined,
					date: date || undefined,
					categories: `[${category.trim()}]`,
					tags: tags.length > 0 ? `[${tags.join(', ')}]` : undefined,
					type: type === 'tech' ? undefined : type,
					image: image.trim() || undefined,
					permalink: permalink.trim() || undefined,
					draft: isPublish ? undefined : (draft ? true : undefined),
				}
				if (isPublish) {
					setDraft(false)
				}
				await adminApi.savePost(postPath!, frontmatter, content)
				localStorage.removeItem(draftStorageKey)
				setOriginalRawContent(content)
				setIsDirty(false)
				showToast(isPublish ? '文章已正式发布上线' : '文章已保存', 'success')
				if (onSaved) onSaved()
			}
		}
		catch (err: any) {
			showToast(`保存失败: ${err.message}`, 'error')
		}
		finally {
			setSaving(false)
		}
	}, [title, isNew, postPath, slug, category, tags, type, permalink, description, content, date, image, draft, draftStorageKey, showToast, onSaved, onBack])

	// 快捷键监听
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 's') {
				e.preventDefault()
				handleSave(false)
			}
			else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
				e.preventDefault()
				handleSave(true)
			}
			else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
				e.preventDefault()
				setLayoutMode(prev => prev === 'split' ? 'preview-only' : 'split')
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [handleSave])

	// 语法静态校验
	const handleValidateMdx = async () => {
		setValidating(true)
		try {
			const res = await adminApi.validatePostMdx(content)
			if (res.valid) {
				showToast('MDX 语法校验通过，无语法错误', 'success')
			}
			else {
				showToast(`语法错误 (第 ${res.line || '?'} 行): ${res.error}`, 'error')
			}
		}
		catch (err: any) {
			showToast(`校验失败: ${err.message}`, 'error')
		}
		finally {
			setValidating(false)
		}
	}

	const handleAddTag = () => {
		if (!tagInput.trim()) return
		const newTags = Array.from(new Set([...tags, tagInput.trim()]))
		setTags(newTags)
		setTagInput('')
	}

	const handleRemoveTag = (t: string) => {
		setTags(tags.filter(x => x !== t))
	}

	const handleInsertSnippet = (snippet: string) => {
		if (!textareaRef.current) return
		const el = textareaRef.current
		const start = el.selectionStart
		const end = el.selectionEnd
		const currentVal = content
		const nextVal = currentVal.substring(0, start) + snippet + currentVal.substring(end)
		setContent(nextVal)
		setTimeout(() => {
			el.focus()
			el.setSelectionRange(start + snippet.length, start + snippet.length)
		}, 50)
	}

	const handleInsertFormat = (prefix: string, suffix: string = '') => {
		if (!textareaRef.current) return
		const el = textareaRef.current
		const start = el.selectionStart
		const end = el.selectionEnd
		const selected = content.substring(start, end)
		const replacement = `${prefix}${selected || '文本'}${suffix}`
		const nextVal = content.substring(0, start) + replacement + content.substring(end)
		setContent(nextVal)
		setTimeout(() => {
			el.focus()
			el.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 2))
		}, 50)
	}

	const handleOpenVsCode = async () => {
		if (!postPath) return
		try {
			await adminApi.openVsCode(postPath)
			showToast('已在 VS Code 中打开', 'success')
		}
		catch (err: any) {
			showToast(err.message, 'error')
		}
	}

	// 恢复历史快照
	const handleRestoreSnapshot = (snapshot: PostSnapshot) => {
		if (snapshot.frontmatter) {
			if (snapshot.frontmatter.title) setTitle(snapshot.frontmatter.title)
			if (snapshot.frontmatter.description) setDescription(snapshot.frontmatter.description)
		}
		setContent(snapshot.content)
		setShowHistoryModal(false)
		showToast(`已成功恢复至历史快照 (${snapshot.timestamp})`, 'success')
	}

	// 提取 TOC 目录
	const tocList: TocItem[] = []
	const lines = content.split('\n')
	lines.forEach((line, idx) => {
		const match = line.match(/^(#{1,6})\s+(.*)$/)
		if (match) {
			tocList.push({
				level: match[1]!.length,
				text: match[2]!.trim(),
				lineIndex: idx,
			})
		}
	})

	const stats = calculatePostStats(content)

	const frontmatterPreviewData = {
		title: title.trim() || '无标题文章',
		description: description.trim(),
		date: date || Temporal.Now.plainDateTimeISO().toLocaleString('sv'),
		updated: Temporal.Now.plainDateTimeISO().toLocaleString('sv'),
		categories: [category],
		tags,
		image,
		type,
	}

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
				<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
			</div>
		)
	}

	const [isZenMode, setIsZenMode] = useState(false)

	return (
		<div
			style={isZenMode ? {
				position: 'fixed',
				inset: 0,
				background: 'var(--admin-bg)',
				zIndex: 99999,
				padding: 12,
				display: 'flex',
				flexDirection: 'column',
				gap: 8,
			} : {
				display: 'flex',
				flexDirection: 'column',
				gap: 10,
				height: 'calc(100vh - 100px)',
			}}
		>
			{/* 草稿恢复提示 */}
			{hasDraftNotice && (
				<div
					style={{
						padding: '6px 14px',
						background: 'var(--admin-warning-soft)',
						border: '1px solid var(--admin-warning)',
						borderRadius: 6,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						fontSize: 12,
						color: 'var(--admin-text-1)',
					}}
				>
					<span>检测到本地存在未保存的最新草稿，是否恢复？</span>
					<div style={{ display: 'flex', gap: 6 }}>
						<button type="button" className="admin-btn btn-primary btn-sm" onClick={handleRestoreDraft}>
							恢复草稿
						</button>
						<button type="button" className="admin-btn btn-ghost btn-sm" onClick={handleDiscardDraft}>
							放弃
						</button>
					</div>
				</div>
			)}

			{/* 顶部操作条 */}
			<div
				className="admin-card"
				style={{
					padding: '8px 14px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					flexShrink: 0,
					flexWrap: 'wrap',
					gap: 8,
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
					<button type="button" className="admin-btn btn-secondary btn-sm" onClick={onBack}>
						<Icon icon="tabler:arrow-left" />
						<span>返回</span>
					</button>

					<div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
						<span
							className={`pulse-indicator ${isDirty ? 'dirty' : 'online'}`}
							title={isDirty ? '存在未保存修改' : '所有修改已实时保存'}
						/>
						<span>{isNew ? '新建文章' : `${title || '无标题'}`}</span>
						{draft && <span className="admin-badge badge-warning">草稿</span>}
						{isDirty && <span className="admin-badge badge-secondary" style={{ fontSize: 10 }}>未保存</span>}
					</div>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
					{/* 沉浸全屏模式切换 */}
					<button
						type="button"
						className={`admin-btn ${isZenMode ? 'btn-primary' : 'btn-secondary'} btn-sm`}
						onClick={() => setIsZenMode(!isZenMode)}
						title={isZenMode ? '退出沉浸全屏' : '进入沉浸全屏写作模式'}
					>
						<Icon icon={isZenMode ? 'tabler:minimize' : 'tabler:maximize'} />
						<span>{isZenMode ? '退出全屏' : '全屏'}</span>
					</button>

					{/* 布局切换器 */}
					<div style={{ display: 'flex', background: 'var(--admin-bg-subtle)', padding: 2, borderRadius: 6, border: '1px solid var(--admin-border)', gap: 2 }}>
						<button
							type="button"
							className={`admin-btn ${layoutMode === 'split' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setLayoutMode('split')}
							title="左右双栏实时预览"
							style={{ padding: '0 6px', height: 24 }}
						>
							<Icon icon="tabler:layout-columns" />
						</button>
						<button
							type="button"
							className={`admin-btn ${layoutMode === 'vertical' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setLayoutMode('vertical')}
							title="上下双栏实时预览"
							style={{ padding: '0 6px', height: 24 }}
						>
							<Icon icon="tabler:layout-rows" />
						</button>
						<button
							type="button"
							className={`admin-btn ${layoutMode === 'editor-only' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setLayoutMode('editor-only')}
							title="纯编辑模式"
							style={{ padding: '0 6px', height: 24 }}
						>
							<Icon icon="tabler:edit" />
						</button>
						<button
							type="button"
							className={`admin-btn ${layoutMode === 'preview-only' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setLayoutMode('preview-only')}
							title="纯预览模式"
							style={{ padding: '0 6px', height: 24 }}
						>
							<Icon icon="tabler:eye" />
						</button>
					</div>

					<button
						type="button"
						className={`admin-btn ${showToc ? 'btn-primary' : 'btn-secondary'} btn-sm`}
						onClick={() => setShowToc(!showToc)}
						title="文章目录大纲"
					>
						<Icon icon="tabler:list-tree" />
						<span>大纲 ({tocList.length})</span>
					</button>

					<button
						type="button"
						className="admin-btn btn-secondary btn-sm"
						onClick={handleValidateMdx}
						disabled={validating}
						title="MDX 静态语法校验"
					>
						<Icon icon="tabler:code-check" />
						<span>校验</span>
					</button>

					{!isNew && (
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={() => setShowHistoryModal(true)}
							title="查看历史版本与恢复"
						>
							<Icon icon="tabler:history" />
							<span>历史版本</span>
						</button>
					)}

					{!isNew && (
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={() => setShowDiffModal(true)}
							title="改动比对"
						>
							<Icon icon="tabler:git-compare" />
							<span>Diff</span>
						</button>
					)}

					<button
						type="button"
						className="admin-btn btn-secondary btn-sm"
						onClick={() => setShowMeta(!showMeta)}
					>
						<Icon icon={showMeta ? 'tabler:layout-sidebar-right-collapse' : 'tabler:layout-sidebar-right'} />
						<span>{showMeta ? '收起属性' : '元数据'}</span>
					</button>

					{!isNew && (
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={handleOpenVsCode}
							title="在 VS Code 中打开"
						>
							<Icon icon="tabler:brand-vscode" />
						</button>
					)}

					<button
						type="button"
						className="admin-btn btn-primary btn-sm"
						onClick={() => handleSave(false)}
						disabled={saving}
					>
						<Icon icon={saving ? 'tabler:loader-2' : 'tabler:device-floppy'} />
						<span>{saving ? '保存中...' : isNew ? '创建发布' : '保存 (Ctrl+S)'}</span>
					</button>
				</div>
			</div>

			{/* Frontmatter 元数据折叠面板 */}
			{showMeta && (
				<div
					className="admin-card"
					style={{
						padding: '12px 14px',
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
						gap: 10,
						flexShrink: 0,
					}}
				>
					<div>
						<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
							标题
						</label>
						<input
							type="text"
							className="admin-input"
							placeholder="文章标题"
							value={title}
							onChange={e => setTitle(e.target.value)}
						/>
					</div>

					{isNew && (
						<div>
							<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
								文件名 Slug (可选)
							</label>
							<input
								type="text"
								className="admin-input"
								placeholder="如 my-post (默认使用标题)"
								value={slug}
								onChange={e => setSlug(e.target.value)}
							/>
						</div>
					)}

					<div>
						<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
							分类
						</label>
						<select
							className="admin-select"
							value={category}
							onChange={e => setCategory(e.target.value)}
						>
							{(categoriesList.length > 0 ? categoriesList : ['前端开发', '后端开发', '数据库系统', '云原生与运维', '网络安全', '人工智能', '技术', '杂谈', '生活']).map(c => (
								<option key={c} value={c}>{c}</option>
							))}
						</select>
					</div>

					<div>
						<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
							版式
						</label>
						<select
							className="admin-select"
							value={type}
							onChange={e => setType(e.target.value)}
						>
							<option value="tech">技术版式 (Tech)</option>
							<option value="story">故事版式 (Story)</option>
						</select>
					</div>

					<div>
						<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
							封面图
						</label>
						<div style={{ display: 'flex', gap: 4 }}>
							<input
								type="text"
								className="admin-input"
								placeholder="/og-image.jpg"
								value={image}
								onChange={e => setImage(e.target.value)}
							/>
							<button
								type="button"
								className="admin-btn btn-secondary btn-sm"
								onClick={() => setShowAssetPicker(true)}
								title="选择已有图片"
							>
								<Icon icon="tabler:photo" />
							</button>
						</div>
					</div>

					<div style={{ gridColumn: '1 / -1' }}>
						<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
							文章摘要 (Description)
						</label>
						<input
							type="text"
							className="admin-input"
							placeholder="输入文章简明摘要..."
							value={description}
							onChange={e => setDescription(e.target.value)}
						/>
					</div>

					<div style={{ gridColumn: '1 / -1' }}>
						<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
							标签 (Tags)
						</label>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
							{tags.map(t => (
								<span key={t} className="admin-badge badge-primary">
									{t}
									<Icon
										icon="tabler:x"
										style={{ cursor: 'pointer', marginLeft: 3 }}
										onClick={() => handleRemoveTag(t)}
									/>
								</span>
							))}
							<div style={{ display: 'flex', gap: 4 }}>
								<input
									type="text"
									className="admin-input"
									placeholder="添加标签..."
									value={tagInput}
									onChange={e => setTagInput(e.target.value)}
									onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
									style={{ width: 110, height: 26, fontSize: 11 }}
								/>
								<button type="button" className="admin-btn btn-secondary btn-sm" onClick={handleAddTag} style={{ height: 26 }}>
									添加
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* 编辑器与实时预览工作区 */}
			<div
				className="admin-card"
				style={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					padding: 0,
					overflow: 'hidden',
					minHeight: 0,
				}}
			>
				{/* 快捷工具条 */}
				<div
					style={{
						padding: '6px 12px',
						borderBottom: '1px solid var(--admin-border)',
						background: 'var(--admin-bg-subtle)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 8,
						flexWrap: 'wrap',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
						<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('**', '**')} title="粗体 (Ctrl+B)">
							<Icon icon="tabler:bold" />
						</button>
						<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('*', '*')} title="斜体 (Ctrl+I)">
							<Icon icon="tabler:italic" />
						</button>
						<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('~~', '~~')} title="删除线">
							<Icon icon="tabler:strikethrough" />
						</button>
						<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('`', '`')} title="行内代码">
							<Icon icon="tabler:code-circle" />
						</button>
						<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('> ')} title="引用区块">
							<Icon icon="tabler:quote" />
						</button>
						<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('## ')} title="二级标题">
							<Icon icon="tabler:h-2" />
						</button>
						<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('### ')} title="三级标题">
							<Icon icon="tabler:h-3" />
						</button>
						<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('- ')} title="无序列表">
							<Icon icon="tabler:list" />
						</button>
						<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('- [ ] ')} title="任务清单">
							<Icon icon="tabler:checkbox" />
						</button>
						<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('```ts\n', '\n```')} title="代码块">
							<Icon icon="tabler:code" />
						</button>
						<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('\n| 列1 | 列2 |\n| --- | --- |\n| 内容1 | 内容2 |\n')} title="插入表格">
							<Icon icon="tabler:table" />
						</button>
						<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('\n---\n')} title="分割线">
							<Icon icon="tabler:minus" />
						</button>
						<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('[链接文本](', ')')} title="超链接">
							<Icon icon="tabler:link" />
						</button>

						<div style={{ width: 1, height: 16, background: 'var(--admin-border)', margin: '0 2px' }} />

						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={() => setShowAssetPicker(true)}
							title="挑选媒体图片"
						>
							<Icon icon="tabler:photo" />
							<span>媒体库</span>
						</button>
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={() => setShowIconPicker(true)}
							title="插入图标"
						>
							<Icon icon="tabler:mood-smile" />
							<span>图标库</span>
						</button>

						<div style={{ width: 1, height: 16, background: 'var(--admin-border)', margin: '0 2px' }} />

						<MdcSnippetsPicker onInsert={handleInsertSnippet} />
					</div>

					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', display: 'flex', gap: 10, alignItems: 'center' }}>
						<span>{stats.chineseCount} 汉字</span>
						<span>{stats.englishWords} 词</span>
						<span>{lines.length} 行</span>
						<span>{stats.imageCount} 图</span>
						<span>约 {stats.readingMinutes} 分钟</span>
					</div>
				</div>

				{/* 动态视口排版 */}
				<div
					style={{
						flex: 1,
						display: 'flex',
						flexDirection: layoutMode === 'vertical' ? 'column' : 'row',
						minHeight: 0,
					}}
				>
					{/* 大纲侧边树 */}
					{showToc && (
						<div
							style={{
								width: layoutMode === 'vertical' ? '100%' : 200,
								maxHeight: layoutMode === 'vertical' ? 120 : undefined,
								borderRight: layoutMode === 'vertical' ? 'none' : '1px solid var(--admin-border)',
								borderBottom: layoutMode === 'vertical' ? '1px solid var(--admin-border)' : 'none',
								background: 'var(--admin-surface)',
								padding: '10px 8px',
								overflowY: 'auto',
								display: 'flex',
								flexDirection: 'column',
								gap: 2,
								flexShrink: 0,
							}}
						>
							<div style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-3)', padding: '4px 6px', textTransform: 'uppercase' }}>
								目录大纲 ({tocList.length})
							</div>
							{tocList.length === 0 ? (
								<div style={{ fontSize: 11, color: 'var(--admin-text-3)', textAlign: 'center', marginTop: 12 }}>
									正文未包含 H1-H6 标题
								</div>
							) : (
								tocList.map((item, idx) => (
									<div
										key={idx}
										style={{
											fontSize: 12,
											padding: '4px 6px',
											borderRadius: 4,
											paddingLeft: (item.level - 1) * 10 + 6,
											cursor: 'pointer',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
											color: item.level <= 2 ? 'var(--admin-text-1)' : 'var(--admin-text-2)',
											fontWeight: item.level <= 2 ? 600 : 400,
										}}
										onMouseEnter={e => (e.currentTarget.style.background = 'var(--admin-surface-hover)')}
										onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
										title={item.text}
									>
										{item.text}
									</div>
								))
							)}
						</div>
					)}

					{/* Markdown 编辑区 */}
					{layoutMode !== 'preview-only' && (
						<div
							style={{
								flex: 1,
								borderRight: layoutMode === 'split' ? '1px solid var(--admin-border)' : 'none',
								borderBottom: layoutMode === 'vertical' ? '1px solid var(--admin-border)' : 'none',
								display: 'flex',
								flexDirection: 'column',
								minWidth: 0,
								minHeight: 0,
							}}
						>
							<textarea
								ref={textareaRef}
								value={content}
								onChange={e => setContent(e.target.value)}
								placeholder="在此书写 Markdown / MDX 正文（右侧将进行像素级同源实时渲染）..."
								style={{
									flex: 1,
									width: '100%',
									border: 'none',
									outline: 'none',
									padding: '16px',
									background: 'transparent',
									color: 'var(--admin-text-1)',
									fontFamily: 'var(--admin-font-mono)',
									fontSize: 13,
									lineHeight: 1.7,
									resize: 'none',
								}}
							/>
						</div>
					)}

					{/* 同源多设备实时渲染预览区 */}
					{layoutMode !== 'editor-only' && (
						<div style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
							<DevicePreviewFrame title="前台同源实时渲染">
								<MarkdownPreview
									content={content}
									frontmatter={frontmatterPreviewData}
									showChrome
								/>
							</DevicePreviewFrame>
						</div>
					)}
				</div>
			</div>

			{/* 差异比对弹窗 */}
			{showDiffModal && (
				<DiffViewerModal
					oldText={originalRawContent}
					newText={content}
					onClose={() => setShowDiffModal(false)}
					onConfirmSave={() => handleSave(false)}
				/>
			)}

			{/* 历史版本快照弹窗 */}
			{showHistoryModal && (
				<HistoryVersionModal
					slug={currentSlug}
					currentContent={content}
					onClose={() => setShowHistoryModal(false)}
					onRestore={handleRestoreSnapshot}
				/>
			)}

			{/* 资产库选图弹窗 */}
			{showAssetPicker && (
				<AssetPickerModal
					onSelect={(markdownImg, rawPath) => {
						if (!image) {
							setImage(rawPath)
						}
						handleInsertSnippet(`\n${markdownImg}\n`)
					}}
					onClose={() => setShowAssetPicker(false)}
				/>
			)}

			{/* 图标选择弹窗 */}
			{showIconPicker && (
				<IconPickerModal
					onSelect={(iconName) => {
						handleInsertSnippet(`:icon{name="${iconName}"}`)
					}}
					onClose={() => setShowIconPicker(false)}
				/>
			)}
		</div>
	)
}

export default PostEditorView
