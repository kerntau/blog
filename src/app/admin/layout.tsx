import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AdminShell } from '@/components/admin/AdminShell'
import { ToastProvider } from '@/components/admin/AdminControls'
import { AdminMuiProvider } from '@/components/admin/AdminMuiProvider'

export const metadata: Metadata = {
	title: { default: '序栈控制台', template: '%s | 序栈控制台' },
	description: '序栈博客内容与发布控制台',
	manifest: '/admin/manifest.webmanifest',
	appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: '序栈控制台' },
	other: { 'mobile-web-app-capable': 'yes' },
}

export default function AdminLayout({ children }: { children: ReactNode }) {
	return <AdminMuiProvider><ToastProvider><AdminShell>{children}</AdminShell></ToastProvider></AdminMuiProvider>
}
