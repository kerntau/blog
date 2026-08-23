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
export type DevicePreviewMode = 'desktop' | 'tablet' | 'mobile'

export const PostEditorView: React.FC<PostEditorViewProps> = ({ postPath, onBack, onSaved }) => {
	const { showToast } = useToast()
	const isNew = !postPath
	const [loading, setLoading] = useState(!isNew)
	const [saving, setSaving] = useState(false)
	const [layoutMode, setLayoutMode] = useState<EditorLayoutMode>('split')
	const [deviceMode, setDeviceMode] = useState<DevicePreviewMode>('desktop')
	const [syncScroll, setSyncScroll] = useState(true)

	// 分栏比例 (20% ~ 80%)
	const [splitRatio, setSplitRatio] = useState<number>(50)
	const isDraggingResizer = useRef(false)

	const [originalRawContent, setOriginalRawContent] = useState('')

	// 表单状态
	const [title, setTitle] = useState('')
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
	const [isZenMode, setIsZenMode] = useState(false)

	// 弹窗状态
	const [showDiffModal, setShowDiffModal] = useState(false)
	const [showAssetPicker, setShowAssetPicker] = useState(false)
	const [showIconPicker, setShowIconPicker] = useState(false)
	const [showHistoryModal, setShowHistoryModal] = useState(false)
	const [hasDraftNotice, setHasDraftNotice] = useState(false)

	const textareaRef = useRef<HTMLTextAreaElement | null>(null)
	const previewScrollRef = useRef<HTMLDivElement | null>(null)
	const containerRef = useRef<HTMLDivElement | null>(null)
	const isSyncingLeftRef = useRef(false)
	const isSyncingRightRef = useRef(false)

	const currentSlug = postPath ? postPath.replace(/^.*[\\/]/, '').replace(/\.(md|mdx)$/i, '') : 'new-post'
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
		}, 1000)
		return () => clearTimeout(timer)
	}, [content, originalRawContent, draftStorageKey])

	// 网页刷新与离开未保存防丢失保护
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (isDirty) {
				e.preventDefault()
				e.returnValue = '您有尚未保存的修改，确定要离开吗？'
				return e.returnValue
			}
		}
		window.addEventListener('beforeunload', handleBeforeUnload)
		return () => window.removeEventListener('beforeunload', handleBeforeUnload)
	}, [isDirty])

	// 格式化与智能排版 (Prettify)
	const handleFormatArticle = () => {
		if (!content) return
		const formatted = `${content
			// 1. 规范化超过2个的连续空行
			.replace(/\n{3,}/g, '\n\n')
			// 2. 规范化中英文之间的空格
			.replace(/([\u4E00-\u9FA5])([a-zA-Z0-9`])/g, '$1 $2')
			.replace(/([a-zA-Z0-9`])([\u4E00-\u9FA5])/g, '$1 $2')
			// 3. 规范化标题与列表标记后的空格
			.replace(/^(#{1,6})([^\s#])/gm, '$1 $2')
			.replace(/^([*+-])(\S)/gm, '$1 $2')
			.trim()}\n`

		if (formatted !== content) {
			setContent(formatted)
			setIsDirty(true)
			showToast('已完成文章智能格式化与空行修剪', 'success')
		}
		else {
			showToast('当前文章排版已十分规范，无需调整', 'info')
		}
	}

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
	}, [title, isNew, category, tags, type, permalink, description, content, draftStorageKey, postPath, date, draft, image, onSaved, onBack, showToast])

	// 分栏比例拖拽把手
	const handleResizerMouseDown = (e: React.MouseEvent) => {
		e.preventDefault()
		isDraggingResizer.current = true
		document.body.style.cursor = 'col-resize'
		document.body.style.userSelect = 'none'

		const handleMouseMove = (moveEvent: MouseEvent) => {
			if (!isDraggingResizer.current || !containerRef.current) return
			const rect = containerRef.current.getBoundingClientRect()
			const offsetX = moveEvent.clientX - rect.left
			const percentage = (offsetX / rect.width) * 100
			if (percentage >= 20 && percentage <= 80) {
				setSplitRatio(percentage)
			}
		}

		const handleMouseUp = () => {
			isDraggingResizer.current = false
			document.body.style.cursor = ''
			document.body.style.userSelect = ''
			window.removeEventListener('mousemove', handleMouseMove)
			window.removeEventListener('mouseup', handleMouseUp)
		}

		window.addEventListener('mousemove', handleMouseMove)
		window.addEventListener('mouseup', handleMouseUp)
	}

	// 双向平滑同步滚动
	const handleTextareaScroll = () => {
		if (!syncScroll || isSyncingRightRef.current || !textareaRef.current || !previewScrollRef.current) return
		isSyncingLeftRef.current = true
		const el = textareaRef.current
		const target = previewScrollRef.current
		const ratio = el.scrollTop / (el.scrollHeight - el.clientHeight || 1)
		target.scrollTop = ratio * (target.scrollHeight - target.clientHeight)
		setTimeout(() => {
			isSyncingLeftRef.current = false
		}, 40)
	}

	const handlePreviewScroll = () => {
		if (!syncScroll || isSyncingLeftRef.current || !textareaRef.current || !previewScrollRef.current) return
		isSyncingRightRef.current = true
		const el = textareaRef.current
		const target = previewScrollRef.current
		const ratio = target.scrollTop / (target.scrollHeight - target.clientHeight || 1)
		el.scrollTop = ratio * (el.scrollHeight - el.clientHeight)
		setTimeout(() => {
			isSyncingRightRef.current = false
		}, 40)
	}

	// 光标位置精确记忆与 Notion 风格悬浮气泡工具条状态
	const lastSelectionRef = useRef<{ start: number, end: number }>({ start: 0, end: 0 })
	const [bubbleState, setBubbleState] = useState<{
		visible: boolean
		x: number
		y: number
		selectedText: string
	}>({ visible: false, x: 0, y: 0, selectedText: '' })

	const updateLastSelection = () => {
		if (textareaRef.current) {
			const el = textareaRef.current
			const start = el.selectionStart
			const end = el.selectionEnd
			lastSelectionRef.current = { start, end }

			if (start !== end && end - start > 0) {
				const text = el.value.substring(start, end)
				const lines = el.value.substring(0, start).split('\n')
				const currentLine = lines.length
				const currentCol = lines[lines.length - 1].length
				const lineHeight = 22.2 // 13.5px font-size * 1.65 line-height ≈ 22.2px
				const charWidth = 8.1 // monospace char width ≈ 8.1px
				
				const top = currentLine * lineHeight - el.scrollTop + 14
				const left = Math.min(Math.max(currentCol * charWidth + 24, 110), el.clientWidth - 130)

				setBubbleState({
					visible: true,
					x: left,
					y: Math.max(top, 36),
					selectedText: text,
				})
			}
			else {
				setBubbleState(prev => prev.visible ? { ...prev, visible: false } : prev)
			}
		}
	}

	// 插入 Markdown / MDC 文本片段
	const handleInsertSnippet = (snippet: string) => {
		const el = textareaRef.current
		if (!el) {
			setContent(prev => prev + snippet)
			setIsDirty(true)
			return
		}

		const val = content
		const selStart = Math.min(el.selectionStart ?? lastSelectionRef.current.start, val.length)
		const selEnd = Math.min(el.selectionEnd ?? lastSelectionRef.current.end, val.length)

		let insertText = snippet
		// 块级组件智能补齐首尾换行符
		if (snippet.startsWith('::') || snippet.startsWith('```') || snippet.startsWith('#') || snippet.startsWith('|')) {
			const beforeChar = selStart > 0 ? val[selStart - 1] : '\n'
			const afterChar = selEnd < val.length ? val[selEnd] : '\n'

			if (beforeChar !== '\n' && beforeChar !== undefined) {
				insertText = `\n\n${insertText}`
			}
			if (afterChar !== '\n' && afterChar !== undefined && !insertText.endsWith('\n')) {
				insertText = `${insertText}\n`
			}
		}

		const nextVal = val.substring(0, selStart) + insertText + val.substring(selEnd)
		setContent(nextVal)
		setIsDirty(true)

		const newCursorPos = selStart + insertText.length
		lastSelectionRef.current = { start: newCursorPos, end: newCursorPos }

		setTimeout(() => {
			if (textareaRef.current) {
				textareaRef.current.focus()
				textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
			}
		}, 50)
	}

	// 快捷格式包裹
	const handleInsertFormat = (prefix: string, suffix = '') => {
		const el = textareaRef.current
		if (!el) return
		const selStart = el.selectionStart ?? lastSelectionRef.current.start
		const selEnd = el.selectionEnd ?? lastSelectionRef.current.end
		const selected = content.substring(selStart, selEnd)
		const replacement = `${prefix}${selected || '文本'}${suffix}`
		const nextVal = content.substring(0, selStart) + replacement + content.substring(selEnd)
		setContent(nextVal)
		setIsDirty(true)

		const selectTargetStart = selStart + prefix.length
		const selectTargetEnd = selectTargetStart + (selected ? selected.length : 2)
		lastSelectionRef.current = { start: selectTargetStart, end: selectTargetEnd }

		setTimeout(() => {
			if (textareaRef.current) {
				textareaRef.current.focus()
				textareaRef.current.setSelectionRange(selectTargetStart, selectTargetEnd)
			}
		}, 50)
	}

	// 上传图片辅助
	const uploadImageFile = async (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = async () => {
				const base64 = (reader.result as string).split(',')[1] || ''
				try {
					const res = await adminApi.uploadAsset(file.name, base64)
					resolve(res.path || `/assets/${file.name}`)
				}
				catch (err) {
					reject(err)
				}
			}
			reader.onerror = reject
			reader.readAsDataURL(file)
		})
	}

	// 文本框剪贴板图片粘贴
	const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
		const items = e.clipboardData?.items
		if (!items) return
		for (let i = 0; i < items.length; i++) {
			const item = items[i]
			if (item && item.type.startsWith('image/')) {
				e.preventDefault()
				const file = item.getAsFile()
				if (file) {
					showToast('正在上传剪贴板图片...', 'info')
					try {
						const url = await uploadImageFile(file)
						handleInsertSnippet(`\n![${file.name.replace(/\.[^/.]+$/, '') || 'image'}](${url})\n`)
						showToast('图片已自动上传并插入正文', 'success')
					}
					catch (err: any) {
						showToast(`图片上传失败: ${err.message}`, 'error')
					}
				}
				return
			}
		}
	}

	// 文本框文件拖放
	const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
		const files = e.dataTransfer?.files
		if (files && files.length > 0) {
			const file = files[0]
			if (file && file.type.startsWith('image/')) {
				e.preventDefault()
				showToast('正在上传拖放图片...', 'info')
				try {
					const url = await uploadImageFile(file)
					handleInsertSnippet(`\n![${file.name.replace(/\.[^/.]+$/, '') || 'image'}](${url})\n`)
					showToast('图片已成功上传并插入正文', 'success')
				}
				catch (err: any) {
					showToast(`图片上传失败: ${err.message}`, 'error')
				}
			}
		}
	}

	// Tab 键与常用快捷键增强 (Ctrl+S 保存, Ctrl+B 粗体等)
	const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
			e.preventDefault()
			handleSave(false)
			return
		}

		if (e.key === 'Tab') {
			e.preventDefault()
			const el = textareaRef.current
			if (!el) return
			const start = el.selectionStart
			const end = el.selectionEnd
			const val = el.value

			if (e.shiftKey) {
				const lineStart = val.lastIndexOf('\n', start - 1) + 1
				const nextNewline = val.indexOf('\n', end)
				const lineEnd = nextNewline === -1 ? val.length : nextNewline
				const block = val.slice(lineStart, lineEnd)
				const unindented = block.split('\n').map(l => l.startsWith('  ') ? l.slice(2) : l.startsWith('\t') ? l.slice(1) : l).join('\n')
				const nextVal = val.slice(0, lineStart) + unindented + val.slice(lineEnd)
				setContent(nextVal)
			}
			else {
				if (start === end) {
					const nextVal = val.substring(0, start) + '  ' + val.substring(end)
					setContent(nextVal)
					setTimeout(() => {
						el.selectionStart = el.selectionEnd = start + 2
					}, 0)
				}
				else {
					const lineStart = val.lastIndexOf('\n', start - 1) + 1
					const nextNewline = val.indexOf('\n', end)
					const lineEnd = nextNewline === -1 ? val.length : nextNewline
					const block = val.slice(lineStart, lineEnd)
					const indented = block.split('\n').map(l => '  ' + l).join('\n')
					const nextVal = val.slice(0, lineStart) + indented + val.slice(lineEnd)
					setContent(nextVal)
				}
			}
		}
		else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
			e.preventDefault()
			handleInsertFormat('**', '**')
		}
		else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
			e.preventDefault()
			handleInsertFormat('*', '*')
		}
		else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault()
			handleInsertFormat('[', '](url)')
		}
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

	// 点击 TOC 章节跳转
	const handleJumpToToc = (item: TocItem) => {
		if (textareaRef.current) {
			const el = textareaRef.current
			const targetCharOffset = lines.slice(0, item.lineIndex).join('\n').length
			el.focus()
			el.setSelectionRange(targetCharOffset, targetCharOffset + item.text.length + item.level + 1)
			const lineScrollRatio = item.lineIndex / Math.max(1, lines.length)
			el.scrollTop = lineScrollRatio * (el.scrollHeight - el.clientHeight)
		}
		if (previewScrollRef.current) {
			const container = previewScrollRef.current
			const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'))
			const targetEl = headings.find(h => (h.textContent || '').includes(item.text))
			if (targetEl) {
				targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
			}
		}
	}

	const stats = calculatePostStats(content)

	const frontmatterPreviewData = {
		path: postPath || '',
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
				<Icon icon="tabler:loader-2" style={{ fontSize: 28, color: 'var(--admin-accent)', animation: 'spin 1s linear infinite' }} />
			</div>
		)
	}

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
				gap: 8,
				height: 'calc(100vh - 100px)',
			}}
		>
			{/* 草稿恢复提示 */}
			{hasDraftNotice && (
				<div
					style={{
						padding: '8px 14px',
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
					<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
						<Icon icon="tabler:history" style={{ color: 'var(--admin-warning)' }} />
						检测到本地存在未保存的最新草稿，是否恢复？
					</span>
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

			{/* 顶层主操作栏 */}
			<div
				className="admin-card"
				style={{
					padding: '8px 14px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 12,
					flexWrap: 'wrap',
				}}
			>
				{/* 左侧：返回与标题编辑 */}
				<div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280 }}>
					<button
						type="button"
						className="admin-btn btn-ghost btn-sm"
						onClick={() => {
							// eslint-disable-next-line no-alert
							if (isDirty && typeof window !== 'undefined' && !window.confirm('您有尚未保存的文章修改，确定要放弃并返回吗？')) {
								return
							}
							onBack()
						}}
						title="返回文章列表"
					>
						<Icon icon="tabler:arrow-left" />
						<span>返回</span>
					</button>

					<input
						type="text"
						className="admin-input"
						value={title}
						onChange={e => setTitle(e.target.value)}
						placeholder="输入文章标题..."
						style={{
							fontSize: 15,
							fontWeight: 650,
							flex: 1,
							border: '1px solid var(--admin-border-focus)',
							background: 'var(--admin-surface)',
						}}
					/>

					{isDirty && (
						<span
							style={{
								fontSize: 11,
								color: 'var(--admin-warning)',
								display: 'inline-flex',
								alignItems: 'center',
								gap: 4,
								whiteSpace: 'nowrap',
							}}
							title="有未保存的本地修改"
						>
							<Icon icon="tabler:circle-filled" style={{ fontSize: 8 }} />
							未保存
						</span>
					)}
				</div>

				{/* 右侧：功能按钮组 */}
				<div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
					{/* 布局模式切换 */}
					<div className="admin-btn-group" style={{ display: 'flex', border: '1px solid var(--admin-border)', borderRadius: 6, overflow: 'hidden' }}>
						<button
							type="button"
							className={`admin-btn btn-sm ${layoutMode === 'split' ? 'btn-primary' : 'btn-ghost'}`}
							onClick={() => setLayoutMode('split')}
							title="左右分栏 (Split)"
							style={{ borderRadius: 0 }}
						>
							<Icon icon="tabler:layout-columns" />
						</button>
						<button
							type="button"
							className={`admin-btn btn-sm ${layoutMode === 'vertical' ? 'btn-primary' : 'btn-ghost'}`}
							onClick={() => setLayoutMode('vertical')}
							title="上下垂直分屏 (Vertical)"
							style={{ borderRadius: 0 }}
						>
							<Icon icon="tabler:layout-rows" />
						</button>
						<button
							type="button"
							className={`admin-btn btn-sm ${layoutMode === 'editor-only' ? 'btn-primary' : 'btn-ghost'}`}
							onClick={() => setLayoutMode('editor-only')}
							title="纯编辑模式"
							style={{ borderRadius: 0 }}
						>
							<Icon icon="tabler:edit" />
						</button>
						<button
							type="button"
							className={`admin-btn btn-sm ${layoutMode === 'preview-only' ? 'btn-primary' : 'btn-ghost'}`}
							onClick={() => setLayoutMode('preview-only')}
							title="纯预览模式"
							style={{ borderRadius: 0 }}
						>
							<Icon icon="tabler:eye" />
						</button>
					</div>

					{/* 预览端模拟 */}
					{layoutMode !== 'editor-only' && (
						<div className="admin-btn-group" style={{ display: 'flex', border: '1px solid var(--admin-border)', borderRadius: 6, overflow: 'hidden' }}>
							<button
								type="button"
								className={`admin-btn btn-sm ${deviceMode === 'desktop' ? 'btn-secondary' : 'btn-ghost'}`}
								onClick={() => setDeviceMode('desktop')}
								title="桌面视口"
								style={{ borderRadius: 0 }}
							>
								<Icon icon="tabler:device-desktop" />
							</button>
							<button
								type="button"
								className={`admin-btn btn-sm ${deviceMode === 'tablet' ? 'btn-secondary' : 'btn-ghost'}`}
								onClick={() => setDeviceMode('tablet')}
								title="平板视口"
								style={{ borderRadius: 0 }}
							>
								<Icon icon="tabler:device-tablet" />
							</button>
							<button
								type="button"
								className={`admin-btn btn-sm ${deviceMode === 'mobile' ? 'btn-secondary' : 'btn-ghost'}`}
								onClick={() => setDeviceMode('mobile')}
								title="手机真机视口"
								style={{ borderRadius: 0 }}
							>
								<Icon icon="tabler:device-mobile" />
							</button>
						</div>
					)}

					{/* 属性面板切换 */}
					<button
						type="button"
						className={`admin-btn btn-sm ${showMeta ? 'btn-secondary' : 'btn-ghost'}`}
						onClick={() => setShowMeta(!showMeta)}
						title="文章属性 Frontmatter"
					>
						<Icon icon="tabler:adjustments-horizontal" />
						<span>属性</span>
					</button>

					{/* 大纲目录切换 */}
					<button
						type="button"
						className={`admin-btn btn-sm ${showToc ? 'btn-secondary' : 'btn-ghost'}`}
						onClick={() => setShowToc(!showToc)}
						title="文章大纲 TOC"
					>
						<Icon icon="tabler:list-tree" />
						<span>大纲 ({tocList.length})</span>
					</button>

					{/* 更多工具 */}
					{postPath && (
						<>
							<a
								href={permalink ? (permalink.startsWith('/') ? permalink : `/${permalink}`) : `/${currentSlug}`}
								target="_blank"
								rel="noreferrer"
								className="admin-btn btn-ghost btn-sm"
								title="在前台新标签页预览本文章"
								style={{ textDecoration: 'none' }}
							>
								<Icon icon="tabler:external-link" />
								<span>前台预览</span>
							</a>
							<button
								type="button"
								className="admin-btn btn-ghost btn-sm"
								onClick={() => setShowHistoryModal(true)}
								title="历史快照与版本恢复"
							>
								<Icon icon="tabler:history" />
							</button>
							<button
								type="button"
								className="admin-btn btn-ghost btn-sm"
								onClick={() => setShowDiffModal(true)}
								title="查看未保存差异 Diff"
							>
								<Icon icon="tabler:git-compare" />
							</button>
							<button
								type="button"
								className="admin-btn btn-ghost btn-sm"
								onClick={handleOpenVsCode}
								title="在 VS Code 中打开本文章"
							>
								<Icon icon="tabler:brand-vscode" />
							</button>
						</>
					)}

					{/* 禅模式 */}
					<button
						type="button"
						className={`admin-btn btn-sm ${isZenMode ? 'btn-primary' : 'btn-ghost'}`}
						onClick={() => setIsZenMode(!isZenMode)}
						title="全屏禅模式 (无干扰写作)"
					>
						<Icon icon={isZenMode ? 'tabler:minimize' : 'tabler:maximize'} />
					</button>

					{/* 保存与发布 */}
					<button
						type="button"
						className="admin-btn btn-secondary btn-sm"
						onClick={() => handleSave(false)}
						disabled={saving}
						title="保存草稿 (Ctrl+S)"
					>
						{saving ? <Icon icon="tabler:loader-2" style={{ animation: 'spin 1s linear infinite' }} /> : <Icon icon="tabler:device-floppy" />}
						<span>保存</span>
					</button>

					<button
						type="button"
						className="admin-btn btn-primary btn-sm"
						onClick={() => handleSave(true)}
						disabled={saving}
						title="正式发布上线"
					>
						<Icon icon="tabler:send" />
						<span>发布</span>
					</button>
				</div>
			</div>

			{/* Frontmatter 折叠属性面板 */}
			{showMeta && (
				<div
					className="admin-card"
					style={{
						padding: '12px 16px',
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
						gap: 10,
						fontSize: 12,
						background: 'var(--admin-surface)',
						border: '1px solid var(--admin-border)',
					}}
				>
					<div>
						<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 4, fontWeight: 500 }}>
							分类 (Category)
						</label>
						<div style={{ display: 'flex', gap: 4 }}>
							<select
								className="admin-select"
								value={category}
								onChange={e => setCategory(e.target.value)}
								style={{ flex: 1, padding: '4px 8px', fontSize: 12 }}
							>
								{categoriesList.map(c => (
									<option key={c} value={c}>{c}</option>
								))}
								{!categoriesList.includes(category) && (
									<option value={category}>{category}</option>
								)}
							</select>
						</div>
					</div>

					<div>
						<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 4, fontWeight: 500 }}>
							标签 (Tags)
						</label>
						<div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
							<input
								type="text"
								className="admin-input"
								placeholder="添加标签按回车..."
								value={tagInput}
								onChange={e => setTagInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && tagInput.trim()) {
										e.preventDefault()
										if (!tags.includes(tagInput.trim())) {
											setTags([...tags, tagInput.trim()])
										}
										setTagInput('')
									}
								}}
								style={{ flex: 1, padding: '4px 8px', fontSize: 12 }}
							/>
						</div>
						{tags.length > 0 && (
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
								{tags.map(t => (
									<span
										key={t}
										className="admin-badge badge-primary"
										style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer' }}
										onClick={() => setTags(tags.filter(item => item !== t))}
										title="点击移除标签"
									>
										#{t}
										<Icon icon="tabler:x" style={{ fontSize: 10 }} />
									</span>
								))}
							</div>
						)}
					</div>

					<div>
						<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 4, fontWeight: 500 }}>
							文章类型 (Type)
						</label>
						<select
							className="admin-select"
							value={type}
							onChange={e => setType(e.target.value)}
							style={{ width: '100%', padding: '4px 8px', fontSize: 12 }}
						>
							<option value="tech">tech (技术文章)</option>
							<option value="story">story (故事随笔)</option>
							<option value="note">note (短篇笔记)</option>
							<option value="weekly">weekly (周刊周记)</option>
						</select>
					</div>

					<div>
						<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 4, fontWeight: 500 }}>
							封面图 (Image)
						</label>
						<div style={{ display: 'flex', gap: 4 }}>
							<input
								type="text"
								className="admin-input"
								placeholder="/assets/cover.jpg"
								value={image}
								onChange={e => setImage(e.target.value)}
								style={{ flex: 1, padding: '4px 8px', fontSize: 12 }}
							/>
							<button
								type="button"
								className="admin-btn btn-ghost btn-sm"
								onClick={() => setShowAssetPicker(true)}
								title="从媒体库选取图片"
							>
								<Icon icon="tabler:photo" />
							</button>
						</div>
					</div>

					{/* 自定义 URL / 永久链接 (Permalink) */}
					<div style={{ gridColumn: '1 / -1', background: 'var(--admin-bg-subtle)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--admin-border)' }}>
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
							<label style={{ color: 'var(--admin-text-2)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
								<Icon icon="tabler:link" style={{ color: 'var(--admin-accent)', fontSize: 15 }} />
								<span>自定义文章链接 / 永久短链 (Permalink / Custom URL)</span>
							</label>

							<div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									onClick={() => {
										if (!title.trim()) {
											showToast('请先输入文章标题', 'warning')
											return
										}
										const generated = title.trim()
											.toLowerCase()
											.replace(/[\s/\\?%*:|"<>]+/g, '-')
											.replace(/^-+|-+$/g, '')
										setPermalink(generated)
										setIsDirty(true)
										showToast('已根据标题生成 URL Slug', 'success')
									}}
									style={{ fontSize: 11, padding: '2px 6px' }}
									title="根据当前文章标题智能生成 URL Slug"
								>
									<Icon icon="tabler:wand" />
									<span>按标题生成 Slug</span>
								</button>

								{permalink && (
									<button
										type="button"
										className="admin-btn btn-ghost btn-sm"
										onClick={() => {
											setPermalink('')
											setIsDirty(true)
											showToast('已恢复默认文件名路径', 'info')
										}}
										style={{ fontSize: 11, padding: '2px 6px', color: 'var(--admin-text-3)' }}
										title="清除自定义 URL 并使用默认文件名路径"
									>
										<Icon icon="tabler:rotate" />
										<span>恢复默认</span>
									</button>
								)}
							</div>
						</div>

						<div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
							<span style={{ fontSize: 12, color: 'var(--admin-text-3)', fontFamily: 'var(--admin-font-mono)', flexShrink: 0 }}>
								/
							</span>
							<input
								type="text"
								className="admin-input"
								placeholder={`例如: ${currentSlug || 'custom-post-url'} 或 posts/my-article`}
								value={permalink}
								onChange={e => {
									setPermalink(e.target.value)
									setIsDirty(true)
								}}
								style={{ flex: 1, padding: '5px 10px', fontSize: 12, fontFamily: 'var(--admin-font-mono)' }}
							/>
						</div>

						{/* 最终访问链接与复制 */}
						<div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--admin-text-3)' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								<span>前台访问路径:</span>
								<code style={{ color: 'var(--admin-accent)', background: 'var(--admin-accent-soft)', padding: '1px 5px', borderRadius: 3, fontFamily: 'var(--admin-font-mono)' }}>
									{permalink ? (permalink.startsWith('/') ? permalink : `/${permalink}`) : `/${currentSlug || 'posts/...'}`}
								</code>
							</div>
							<button
								type="button"
								className="admin-btn btn-ghost btn-sm"
								onClick={() => {
									const finalUrl = permalink ? (permalink.startsWith('/') ? permalink : `/${permalink}`) : `/${currentSlug}`
									navigator.clipboard.writeText(finalUrl)
									showToast('已复制前台访问相对路径', 'success')
								}}
								style={{ fontSize: 11, padding: '1px 6px', height: 22 }}
								title="复制前台相对路径"
							>
								<Icon icon="tabler:copy" />
								<span>复制路径</span>
							</button>
						</div>
					</div>

					<div style={{ gridColumn: '1 / -1' }}>
						<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 4, fontWeight: 500 }}>
							文章摘要简介 (Description)
						</label>
						<input
							type="text"
							className="admin-input"
							placeholder="输入文章简要描述（将展示在列表和文章头部卡片）..."
							value={description}
							onChange={e => setDescription(e.target.value)}
							style={{ width: '100%', padding: '4px 8px', fontSize: 12 }}
						/>
					</div>
				</div>
			)}

			{/* Markdown / MDC 快捷排版工具栏 */}
			<div
				className="admin-card"
				style={{
					padding: '6px 12px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 6,
					overflowX: 'auto',
					background: 'var(--admin-surface)',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
					{/* 基础排版 */}
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertSnippet('## ')} title="二级标题 H2">
						<strong>H2</strong>
					</button>
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertSnippet('### ')} title="三级标题 H3">
						<strong>H3</strong>
					</button>
					<div style={{ width: 1, height: 16, background: 'var(--admin-border)', margin: '0 2px' }} />

					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('**', '**')} title="加粗 (Ctrl+B)">
						<Icon icon="tabler:bold" />
					</button>
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('*', '*')} title="斜体 (Ctrl+I)">
						<Icon icon="tabler:italic" />
					</button>
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('~~', '~~')} title="删除线">
						<Icon icon="tabler:strikethrough" />
					</button>
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('`', '`')} title="行内代码">
						<Icon icon="tabler:code" />
					</button>

					<div style={{ width: 1, height: 16, background: 'var(--admin-border)', margin: '0 2px' }} />

					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertFormat('[', '](https://)')} title="插入超链接 (Ctrl+K)">
						<Icon icon="tabler:link" />
					</button>
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => setShowAssetPicker(true)} title="插入图片">
						<Icon icon="tabler:photo-plus" />
					</button>
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertSnippet('\n> 引用内容\n')} title="引用块">
						<Icon icon="tabler:quote" />
					</button>
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertSnippet('\n```typescript\n// 在此输入代码\n```\n')} title="代码块">
						<Icon icon="tabler:code-dots" />
					</button>
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => handleInsertSnippet('\n| 表头1 | 表头2 |\n|---|---|\n| 内容1 | 内容2 |\n')} title="表格">
						<Icon icon="tabler:table" />
					</button>

					<div style={{ width: 1, height: 16, background: 'var(--admin-border)', margin: '0 2px' }} />

					{/* MDC 组件插入器 */}
					<MdcSnippetsPicker onInsert={handleInsertSnippet} />

					<button
						type="button"
						className="admin-btn btn-ghost btn-sm"
						onClick={() => setShowIconPicker(true)}
						title="图标检索与插入"
					>
						<Icon icon="tabler:icons" />
						<span>图标</span>
					</button>

					<div style={{ width: 1, height: 16, background: 'var(--admin-border)', margin: '0 2px' }} />

					{/* 一键排版与格式整理 */}
					<button
						type="button"
						className="admin-btn btn-ghost btn-sm"
						onClick={handleFormatArticle}
						title="智能格式化排版 (修剪多余空行与规范标点空格)"
					>
						<Icon icon="tabler:wand" />
						<span>一键排版</span>
					</button>
				</div>

				{/* 右侧统计与同步滚动 */}
				<div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--admin-text-3)', whiteSpace: 'nowrap' }}>
					<span title="文章总行数">
						<strong style={{ color: 'var(--admin-text-1)' }}>{content.split('\n').length}</strong> 行
					</span>
					<span title="实时总字数">
						<strong style={{ color: 'var(--admin-text-1)' }}>{stats.totalWords}</strong> 字
					</span>
					<span title="预计阅读时长">
						<strong style={{ color: 'var(--admin-text-1)' }}>{stats.readingMinutes}</strong> 分钟
					</span>
					<label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
						<input
							type="checkbox"
							checked={syncScroll}
							onChange={e => setSyncScroll(e.target.checked)}
						/>
						<span>同步滚动</span>
					</label>
				</div>
			</div>

			{/* 主编辑与预览核心视口 */}
			<div
				ref={containerRef}
				style={{
					display: 'flex',
					flexDirection: layoutMode === 'vertical' ? 'column' : 'row',
					flex: 1,
					minHeight: 0,
					position: 'relative',
					gap: 0,
					background: 'var(--admin-surface)',
					border: '1px solid var(--admin-border)',
					borderRadius: 8,
					overflow: 'hidden',
				}}
			>
				{/* 左侧：Markdown 输入区 */}
				{layoutMode !== 'preview-only' && (
					<div
						style={{
							width: layoutMode === 'editor-only' ? '100%' : layoutMode === 'vertical' ? '100%' : `${splitRatio}%`,
							height: layoutMode === 'vertical' ? '50%' : '100%',
							display: 'flex',
							flexDirection: 'column',
							position: 'relative',
							background: 'var(--admin-surface)',
						}}
					>
						<textarea
							ref={textareaRef}
							className="admin-textarea"
							value={content}
							onChange={e => {
								setContent(e.target.value)
								updateLastSelection()
							}}
							onSelect={updateLastSelection}
							onKeyUp={updateLastSelection}
							onClick={updateLastSelection}
							onScroll={() => {
								handleTextareaScroll()
								updateLastSelection()
							}}
							onPaste={handlePaste}
							onDrop={handleDrop}
							onKeyDown={handleTextareaKeyDown}
							placeholder="在此直接输入 Markdown 与 MDC 内容，右侧 0 延迟实时呈现..."
							spellCheck={false}
							style={{
								flex: 1,
								width: '100%',
								height: '100%',
								border: 'none',
								borderRadius: 0,
								padding: '20px 24px',
								fontFamily: 'var(--admin-font-mono)',
								fontSize: 13.5,
								lineHeight: 1.65,
								resize: 'none',
								outline: 'none',
								background: 'transparent',
								color: 'var(--admin-text-1)',
							}}
						/>

						{/* Notion 风格选中文本悬浮气泡条 (Floating Bubble Toolbar) */}
						{bubbleState.visible && (
							<div
								className="editor-bubble-toolbar"
								style={{
									left: bubbleState.x,
									top: bubbleState.y,
								}}
							>
								<button
									type="button"
									className="bubble-btn"
									onClick={() => handleInsertFormat('**', '**')}
									title="加粗 (Ctrl+B)"
								>
									<Icon icon="tabler:bold" />
								</button>
								<button
									type="button"
									className="bubble-btn"
									onClick={() => handleInsertFormat('*', '*')}
									title="斜体 (Ctrl+I)"
								>
									<Icon icon="tabler:italic" />
								</button>
								<button
									type="button"
									className="bubble-btn"
									onClick={() => handleInsertFormat('~~', '~~')}
									title="删除线"
								>
									<Icon icon="tabler:strikethrough" />
								</button>
								<button
									type="button"
									className="bubble-btn"
									onClick={() => handleInsertFormat('`', '`')}
									title="行内代码"
								>
									<Icon icon="tabler:code" />
								</button>
								<div className="bubble-divider" />
								<button
									type="button"
									className="bubble-btn"
									onClick={() => handleInsertFormat('[', '](https://)')}
									title="超链接 (Ctrl+K)"
								>
									<Icon icon="tabler:link" />
								</button>
								<button
									type="button"
									className="bubble-btn"
									onClick={() => handleInsertSnippet(`\n::tip\n${bubbleState.selectedText || '提示内容'}\n::\n`)}
									title="MDC 提示卡片 (Tip)"
								>
									<Icon icon="tabler:bulb" style={{ color: 'var(--admin-warning)' }} />
								</button>
								<button
									type="button"
									className="bubble-btn"
									onClick={() => handleInsertSnippet(`\n::warning\n${bubbleState.selectedText || '注意内容'}\n::\n`)}
									title="MDC 警告卡片 (Warning)"
								>
									<Icon icon="tabler:alert-triangle" style={{ color: 'var(--admin-danger)' }} />
								</button>
								<button
									type="button"
									className="bubble-btn"
									onClick={() => handleInsertFormat('> ')}
									title="引用块"
								>
									<Icon icon="tabler:quote" />
								</button>
							</div>
						)}
					</div>
				)}

				{/* 中间拖拽把手 (左右分栏模式生效) */}
				{layoutMode === 'split' && (
					<div
						onMouseDown={handleResizerMouseDown}
						onDoubleClick={() => setSplitRatio(50)}
						title="按住拖拽调节宽度比例，双击恢复 50:50"
						style={{
							width: 6,
							cursor: 'col-resize',
							background: 'var(--admin-border)',
							position: 'relative',
							zIndex: 10,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							transition: 'background 0.15s ease',
						}}
						className="admin-resizer-handle"
					>
						<div
							style={{
								width: 2,
								height: 24,
								borderRadius: 2,
								background: 'var(--admin-text-4)',
							}}
						/>
					</div>
				)}

				{/* 右侧：0 延迟同源实时预览区 */}
				{layoutMode !== 'editor-only' && (
					<div
						onScroll={handlePreviewScroll}
						style={{
							width: layoutMode === 'preview-only' ? '100%' : layoutMode === 'vertical' ? '100%' : `${100 - splitRatio}%`,
							height: layoutMode === 'vertical' ? '50%' : '100%',
							background: 'var(--admin-bg)',
							overflow: 'hidden',
							position: 'relative',
							display: 'flex',
							flexDirection: 'column',
						}}
					>
						{deviceMode === 'desktop' ? (
							<MarkdownPreview
								content={content}
								frontmatter={frontmatterPreviewData}
								scrollContainerRef={previewScrollRef}
								showChrome={true}
							/>
						) : (
							<DevicePreviewFrame>
								<MarkdownPreview
									content={content}
									frontmatter={frontmatterPreviewData}
									scrollContainerRef={previewScrollRef}
									showChrome={true}
								/>
							</DevicePreviewFrame>
						)}
					</div>
				)}

				{/* 右侧悬浮大纲抽屉 TOC Drawer */}
				{showToc && (
					<div
						style={{
							position: 'absolute',
							top: 0,
							right: 0,
							bottom: 0,
							width: 260,
							background: 'var(--admin-surface)',
							borderLeft: '1px solid var(--admin-border)',
							boxShadow: 'var(--admin-shadow-md)',
							zIndex: 30,
							display: 'flex',
							flexDirection: 'column',
							backdropFilter: 'blur(16px)',
						}}
					>
						<div
							style={{
								padding: '12px 16px',
								borderBottom: '1px solid var(--admin-border)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							<span style={{ fontWeight: 600, fontSize: 13 }}>文章大纲目录</span>
							<button
								type="button"
								className="admin-btn btn-ghost btn-sm"
								onClick={() => setShowToc(false)}
								style={{ padding: 4 }}
							>
								<Icon icon="tabler:x" />
							</button>
						</div>
						<div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
							{tocList.length === 0 ? (
								<div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--admin-text-3)', fontSize: 12 }}>
									暂无标题大纲 (输入 ## 标题 生成)
								</div>
							) : (
								tocList.map((item, idx) => (
									<div
										key={idx}
										onClick={() => handleJumpToToc(item)}
										style={{
											padding: '6px 8px',
											paddingLeft: `${(item.level - 1) * 12 + 8}px`,
											borderRadius: 4,
											cursor: 'pointer',
											fontSize: 12,
											color: 'var(--admin-text-2)',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
										className="admin-toc-item"
										title={item.text}
									>
										{item.text}
									</div>
								))
							)}
						</div>
					</div>
				)}
			</div>

			{/* 辅助弹窗群 */}
			{showAssetPicker && (
				<AssetPickerModal
					onClose={() => setShowAssetPicker(false)}
					onSelect={(_markdown, rawPath) => {
						const targetPath = rawPath || _markdown
						if (targetPath.startsWith('![')) {
							handleInsertSnippet(`\n${targetPath}\n`)
						} else {
							handleInsertSnippet(`\n![image](${targetPath})\n`)
						}
						setShowAssetPicker(false)
						showToast(`已插入图片: ${targetPath}`, 'success')
					}}
				/>
			)}

			{showIconPicker && (
				<IconPickerModal
					onClose={() => setShowIconPicker(false)}
					onSelect={(iconName) => {
						handleInsertSnippet(`:icon{name="${iconName}"}`)
						setShowIconPicker(false)
						showToast(`已插入图标: ${iconName}`, 'success')
					}}
				/>
			)}

			{showHistoryModal && postPath && (
				<HistoryVersionModal
					slug={currentSlug}
					currentContent={content}
					onClose={() => setShowHistoryModal(false)}
					onRestore={(snap: PostSnapshot) => {
						if (snap.frontmatter) {
							if (snap.frontmatter.title) setTitle(snap.frontmatter.title)
							if (snap.frontmatter.description) setDescription(snap.frontmatter.description)
						}
						setContent(snap.content)
						setShowHistoryModal(false)
						showToast(`已成功恢复至快照 (${snap.timestamp})`, 'success')
					}}
				/>
			)}

			{showDiffModal && (
				<DiffViewerModal
					oldText={originalRawContent}
					newText={content}
					onClose={() => setShowDiffModal(false)}
					onConfirmSave={() => {
						setShowDiffModal(false)
						handleSave(false)
					}}
				/>
			)}
		</div>
	)
}

export default PostEditorView
