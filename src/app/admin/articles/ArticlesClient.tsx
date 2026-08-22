'use client'
/* eslint-disable style/max-statements-per-line */

import Link from 'next/link'
import { Icon } from '@iconify/react'
import { useEffect, useMemo, useState } from 'react'
import { Button, StatusBadge } from '@/components/admin/AdminControls'

interface Article { title: string, path: string, publicPath: string, date: string, draft: boolean, categories: string[] }
export default function ArticlesClient({ posts }: { posts: Article[] }) {
	const [query, setQuery] = useState('')
	const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
	const [ascending, setAscending] = useState(false)
	useEffect(() => { const onKey = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.getElementById('article-search')?.focus() } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [])
	const filtered = useMemo(() => posts.filter(post => (filter === 'all' || filter === (post.draft ? 'draft' : 'published')) && `${post.title} ${post.publicPath}`.toLowerCase().includes(query.toLowerCase())).sort((first, second) => ascending ? first.date.localeCompare(second.date) : second.date.localeCompare(first.date)), [ascending, filter, posts, query])
	return (
<><header className="admin-page-heading"><div><h1>文章</h1><p>使用 <kbd>Cmd</kbd> + <kbd>K</kbd> 快速搜索全站内容。</p></div><Link className="admin-button admin-button-primary" href="/admin/editor"><Icon icon="tabler:plus" />新建文章</Link></header>
		<div className="admin-toolbar"><div className="admin-search"><Icon icon="tabler:search" /><input id="article-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索标题或路径" aria-label="搜索文章" /></div><div className="admin-filter" aria-label="文章状态筛选">{[['all', '全部'], ['published', '已发布'], ['draft', '草稿']].map(([value, label]) => <Button type="button" key={value} variant={filter === value ? 'primary' : 'ghost'} onClick={() => setFilter(value as typeof filter)}>{label}</Button>)}</div></div>
		<div className="admin-card admin-table"><div className="admin-table-head"><span>标题</span><button type="button" onClick={() => setAscending(!ascending)}>更新日期 <Icon icon={ascending ? 'tabler:sort-ascending' : 'tabler:sort-descending'} /></button><span>状态</span><span /></div>{filtered.map(post => <article key={post.path} className="admin-table-row"><div><strong>{post.title}</strong><small>{post.categories.join(' / ') || '未分类'} · {post.publicPath}</small></div><time>{post.date || '—'}</time><StatusBadge status={post.draft ? 'draft' : 'published'} /><Link className="admin-button admin-button-ghost" href={`/admin/editor?path=${encodeURIComponent(post.path)}`}>编辑</Link></article>)}{!filtered.length && <p className="admin-table-empty">没有匹配的文章。</p>}</div>
</>
)
}
