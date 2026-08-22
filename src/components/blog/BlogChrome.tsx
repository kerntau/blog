'use client'

import type { ReactNode } from 'react'
import BlogSidebar from './BlogSidebar'
import BlogFooter from './BlogFooter'
import BlogAside from './BlogAside'
import BlogPanel from './BlogPanel'
import ClientProvider from './ClientProvider'
import SkipToContent from './SkipToContent'

export default function BlogChrome({ children }: { children: ReactNode }) {
	return (
		<ClientProvider>
			<SkipToContent />
			<BlogSidebar />
			<div id="content">
				<main id="main-content">
					{children}
					<BlogFooter />
				</main>
				<BlogAside />
			</div>
			<BlogPanel />
		</ClientProvider>
	)
}
