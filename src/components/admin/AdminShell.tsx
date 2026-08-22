'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'
import { AppBar, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, SwipeableDrawer, Toolbar, Typography } from '@mui/material'
import './admin.scss'

const navigation = [
	{ href: '/admin/dashboard', icon: 'tabler:layout-dashboard', label: '工作台' },
	{ href: '/admin/articles', icon: 'tabler:notes', label: '文章' },
	{ href: '/admin/editor', icon: 'tabler:edit', label: '编辑器' },
	{ href: '/admin/media', icon: 'tabler:photo', label: '媒体库' },
	{ href: '/admin/links', icon: 'tabler:link', label: '友链' },
	{ href: '/admin/comments', icon: 'tabler:message-circle', label: '评论' },
	{ href: '/admin/system/updates', icon: 'tabler:git-branch', label: '系统更新' },
]

function Sidebar({ close }: { close?: () => void }) {
	const pathname = usePathname()
	return (
		<nav className="admin-nav" aria-label="控制台导航">
			<div className="admin-brand"><span>序</span><strong>序栈控制台</strong></div>
			<List className="admin-nav-list" dense>
				{navigation.map(item => (
					<ListItemButton key={item.href} component={Link} href={item.href} onClick={close} selected={pathname.startsWith(item.href)}>
						<ListItemIcon><Icon icon={item.icon} /></ListItemIcon><ListItemText primary={item.label} />
					</ListItemButton>
				))}
			</List>
			<div className="admin-nav-footer"><Link href="/" aria-label="返回博客前台"><Icon icon="tabler:arrow-up-right" />返回前台</Link></div>
		</nav>
	)
}

export function AdminShell({ children }: { children: ReactNode }) {
	const [drawerOpen, setDrawerOpen] = useState(false)
	const pathname = usePathname()

	useEffect(() => {
		if ('serviceWorker' in navigator) navigator.serviceWorker.register('/admin-sw.js', { scope: '/admin' }).catch(() => undefined)
	}, [])

	return (
		<div className="admin-shell">
			<Drawer variant="permanent" className="admin-desktop-drawer" slotProps={{ paper: { className: 'admin-desktop-drawer-paper' } }}><Sidebar /></Drawer>
			<AppBar position="fixed" className="admin-mobile-head" elevation={0}><Toolbar><IconButton aria-label="打开导航菜单" onClick={() => setDrawerOpen(true)}><Icon icon="tabler:menu-2" /></IconButton><Typography component="strong">序栈控制台</Typography><IconButton component={Link} href="/admin/editor" aria-label="新建文章"><Icon icon="tabler:plus" /></IconButton></Toolbar></AppBar>
			<SwipeableDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onOpen={() => setDrawerOpen(true)} className="admin-mobile-drawer" slotProps={{ paper: { className: 'admin-mobile-drawer-paper' } }}><Sidebar close={() => setDrawerOpen(false)} /></SwipeableDrawer>
			<main className="admin-main" id="admin-main">
				<div className="admin-breadcrumb"><span>控制台</span><Icon icon="tabler:chevron-right" /><span>{navigation.find(item => pathname.startsWith(item.href))?.label ?? '工作台'}</span></div>
				{children}
			</main>
		</div>
	)
}
