'use client'
/* eslint-disable style/max-statements-per-line, prefer-promise-reject-errors, unicorn/error-message */

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import matter from 'gray-matter'
import { Button, IconPicker, ImageUploader, SegmentedControl, TextInput, Textarea, ToggleSwitch, useToast } from '@/components/admin/AdminControls'

const defaultSource = `---\ntitle: 未命名文章\ndate: ${new Date().toISOString().slice(0, 10)}\ndraft: true\ncategories:\n  - 未分类\ntags: []\ndescription: \ncover: \nfeatured: false\ncomments: true\nicon: tabler:article\n---\n\n# 开始写作\n\n在这里记录你的想法。`
const components = [
	{ label: '提示框', value: '<Tip type="info">提示内容</Tip>' }, 
{ label: '图库', value: '<Pic src="/covers/example.webp" alt="图片描述" />' }, 
{ label: '视频', value: '<VideoEmbed src="https://" />' }, 
{ label: '聊天', value: '<Chat>对话内容</Chat>' }, 
{ label: '诗歌', value: '<Poetry>诗歌内容</Poetry>' },
]
const frontIcons = ['tabler:circle-dashed', 'tabler:mouse', 'tabler:code', 'tabler:bug', 'tabler:message', 'tabler:leaf', 'tabler:article', 'tabler:book', 'tabler:terminal-2', 'tabler:bulb', 'tabler:folder', 'tabler:rocket']

function parse(source: string) { try { return matter(source) } catch { return { data: {}, content: source } } }
function makeSource(data: Record<string, unknown>, content: string) { return matter.stringify(content, data) }

export default function EditorClient() {
	const searchParams = useSearchParams()
	const toast = useToast()
	const articlePath = searchParams.get('path') || '/posts/2026/untitled'
	const [source, setSource] = useState(defaultSource)
	const [view, setView] = useState('edit')
	const [busy, setBusy] = useState(false)
	const parsed = useMemo(() => parse(source), [source])
	const data = parsed.data as Record<string, any>
	const title = String(data.title || '未命名文章')
	const headings = useMemo(() => parsed.content.split('\n').filter(line => /^#{1,3}\s/.test(line)).map(line => ({ level: line.match(/^#+/)![0].length, text: line.replace(/^#+\s/, '') })), [parsed.content])

	useEffect(() => { if (!searchParams.get('path')) return; fetch(`/api/admin/article?path=${encodeURIComponent(articlePath)}`).then(async response => response.ok ? response.json() : Promise.reject()).then(({ source: nextSource }) => setSource(nextSource)).catch(() => toast.show('未找到原文，已载入新的草稿模板')) }, [articlePath, searchParams, toast])
	function updateData(key: string, value: unknown) { setSource(makeSource({ ...data, [key]: value }, parsed.content)) }
	function insert(text: string) { setSource(current => `${current.trimEnd()}\n\n${text}\n`); toast.show('组件已插入到文末') }
	async function save(publish = false) {
		setBusy(true)
		const nextSource = publish ? makeSource({ ...data, draft: false }, parsed.content) : source
		setSource(nextSource)
		if (!searchParams.get('path')) { toast.show(publish ? '文章已标记为发布，选择路径后即可写入文件' : '草稿已保存在当前工作区'); setBusy(false); return }
		try { const response = await fetch('/api/admin/article', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: articlePath, source: nextSource }) }); if (!response.ok) throw new Error(); toast.show(publish ? '文章已发布' : '已保存至草稿') } catch { toast.show('保存失败，请检查文件路径和权限') } finally { setBusy(false) }
	}
	return (
<div className="admin-editor-page"><header className="admin-editor-title"><div><small>{articlePath}</small><h1>{title}</h1></div><div className="admin-editor-desktop-actions"><Button type="button" variant="ghost" onClick={() => setView('preview')}><Icon icon="tabler:eye" />预览</Button><Button type="button" onClick={() => save()} disabled={busy}><Icon icon="tabler:device-floppy" />保存</Button><Button type="button" onClick={() => save(true)} disabled={busy}><Icon icon="tabler:send" />发布</Button></div></header>
		<div className="admin-editor-mobile-tabs"><SegmentedControl value={view} onChange={setView} options={[{ value: 'edit', label: '编辑' }, { value: 'preview', label: '预览' }, { value: 'settings', label: '属性' }]} /></div>
		<div className="admin-editor-layout">
			<section className={`admin-editor-source ${view === 'edit' ? 'active' : ''}`}><header><Icon icon="tabler:brackets" />MDX 源码</header><textarea value={source} onChange={event => setSource(event.target.value)} aria-label="MDX 源码编辑器" spellCheck={false} /></section>
			<section className={`admin-editor-preview ${view === 'preview' ? 'active' : ''}`}><header><Icon icon="tabler:eye" />实时预览</header><article><h1>{title}</h1>{data.description && <p className="admin-preview-description">{data.description}</p>}{parsed.content.split('\n').map((line, index) => line.startsWith('# ') ? <h2 key={index}>{line.slice(2)}</h2> : line.startsWith('## ') ? <h3 key={index}>{line.slice(3)}</h3> : line ? <p key={index}>{line}</p> : null)}</article></section>
			<aside className={`admin-editor-settings ${view === 'settings' ? 'active' : ''}`}><header><Icon icon="tabler:adjustments" />文章属性</header><div className="admin-settings-scroll"><TextInput label="标题" value={title} onChange={event => updateData('title', event.target.value)} clearable /><Textarea label="描述" value={String(data.description || '')} onChange={event => updateData('description', event.target.value)} /><TextInput label="分类（使用逗号分隔）" value={(data.categories || []).join(', ')} onChange={event => updateData('categories', event.target.value.split(',').map(value => value.trim()).filter(Boolean))} /><TextInput label="标签（使用逗号分隔）" value={(data.tags || []).join(', ')} onChange={event => updateData('tags', event.target.value.split(',').map(value => value.trim()).filter(Boolean))} /><ImageUploader value={String(data.cover || '')} onChange={value => updateData('cover', value)} /><IconPicker value={String(data.icon || 'tabler:article')} onChange={value => updateData('icon', value)} icons={frontIcons} /><ToggleSwitch label="允许评论" checked={data.comments !== false} onChange={value => updateData('comments', value)} /><ToggleSwitch label="设为精选" checked={Boolean(data.featured)} onChange={value => updateData('featured', value)} /><section className="admin-outline"><h2>目录结构</h2>{headings.length ? headings.map((heading, index) => <button type="button" key={`${heading.text}-${index}`} style={{ paddingInlineStart: `${(heading.level - 1) * 12}px` }} onClick={() => toast.show(`已定位到：${heading.text}`)}>{heading.text}</button>) : <p>添加标题后会显示目录。</p>}</section><section className="admin-component-menu"><h2>插入前台组件</h2>{components.map(component => <button key={component.label} type="button" onClick={() => insert(component.value)}><Icon icon="tabler:plus" />{component.label}</button>)}</section></div></aside>
		</div><footer className="admin-editor-bottom"><Button type="button" variant="ghost" onClick={() => setView('preview')}><Icon icon="tabler:eye" />预览</Button><Button type="button" onClick={() => save()} disabled={busy}><Icon icon="tabler:device-floppy" />保存</Button><Button type="button" onClick={() => save(true)} disabled={busy}><Icon icon="tabler:send" />发布</Button></footer>
</div>
)
}
