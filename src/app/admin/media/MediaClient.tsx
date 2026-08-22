'use client'
/* eslint-disable style/max-statements-per-line */

import { useState } from 'react'
import { Icon } from '@iconify/react'
import { Button, useToast } from '@/components/admin/AdminControls'

interface Media { path: string, name: string, extension: string }
export default function MediaClient({ media }: { media: Media[] }) {
	const [selected, setSelected] = useState<Media | null>(null)
	const [columns, setColumns] = useState(4)
	const toast = useToast()
	async function copy(media: Media) { await navigator.clipboard?.writeText(`![${media.name}](${media.path})`); toast.show('MDX 图片语法已复制') }
	return (
<><header className="admin-page-heading"><div><h1>媒体库</h1><p>从现有公共资源中选择素材，复制后可直接粘贴到 MDX。</p></div><Button type="button" onClick={() => toast.show('上传将保存到受控媒体服务；当前本地库仅支持选择。')}><Icon icon="tabler:upload" />上传图片</Button></header>
		<div className="admin-media-tools"><label>网格密度 <input type="range" min="2" max="6" value={columns} onChange={event => setColumns(Number(event.target.value))} /></label><span>移动端可双指缩放调整网格</span></div>
		<section className="admin-media-grid" style={{ '--media-columns': columns } as React.CSSProperties}>{media.map(item => <button type="button" key={item.path} onClick={() => setSelected(item)}><img src={item.path} alt={item.name} loading="lazy" /><span>{item.name}</span></button>)}</section>
		{selected && <div className="admin-media-drawer-layer" onClick={() => setSelected(null)}><aside className="admin-media-drawer" onClick={event => event.stopPropagation()}><Button type="button" variant="ghost" onClick={() => setSelected(null)}><Icon icon="tabler:x" />关闭</Button><img src={selected.path} alt={selected.name} /><h2>{selected.name}</h2><dl><div><dt>路径</dt><dd>{selected.path}</dd></div><div><dt>类型</dt><dd>{selected.extension.toUpperCase()}</dd></div><div><dt>Alt 文本</dt><dd><input defaultValue={selected.name.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '')} aria-label="图片 Alt 文本" /></dd></div></dl><Button type="button" onClick={() => copy(selected)}><Icon icon="tabler:copy" />复制 MDX 语法</Button></aside></div>}
</>
)
}
