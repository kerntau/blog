import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Script from 'next/script'
import { pascalCase } from 'es-toolkit/string'
import blogConfig from '../../blog.config'
import packageJson from '../../package.json'
import { Providers } from './providers'
import BlogChrome from '../components/blog/BlogChrome'

import '../assets/css/animation.scss'
import '../assets/css/article.scss'
import '../assets/css/color.scss'
import '../assets/css/font.scss'
import '../assets/css/main.scss'
import '../assets/css/migration-components.scss'
import '../assets/css/reusable.scss'
import './layout.scss'

// 此处配置无需修改
export const revalidate = 3600

export const metadata: Metadata = {
	metadataBase: new URL(blogConfig.url),
	title: {
		template: `%s | ${blogConfig.title}`,
		default: blogConfig.title,
	},
	description: blogConfig.description,
	authors: [{ name: blogConfig.author.name, url: blogConfig.author.homepage }],
	generator: `${pascalCase(packageJson.name)} ${packageJson.version}`,
	icons: {
		icon: [
			{ url: '/favicon.ico' },
			{ url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
			{ url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
		],
		apple: [
			{ url: '/apple-touch-icon.png' },
		],
	},
	alternates: {
		types: { 'application/atom+xml': '/atom.xml' },
	},
	other: {
		'color-scheme': 'light dark',
		'mobile-web-app-capable': 'yes',
	},
}

export default function RootLayout({ children }: { children: ReactNode }) {
	const scripts = process.env.NODE_ENV === 'development'
		? (blogConfig.scripts as any[]).filter(script => !script.src?.includes('cloudflareinsights.com'))
		: (blogConfig.scripts as any[])

	return (
		<html lang={blogConfig.language} data-scroll-behavior="smooth" suppressHydrationWarning>
			<head>
				{/* 预连接与 DNS 预解析 */}
				{blogConfig.twikoo.preload && (
					<>
						<link rel="preconnect" href={blogConfig.twikoo.preload} />
						<link rel="dns-prefetch" href={blogConfig.twikoo.preload} />
					</>
				)}
				<link rel="dns-prefetch" href="https://rsms.me" />
				<link rel="dns-prefetch" href="https://fonts.gstatic.cn" />
				<link rel="dns-prefetch" href="https://npm.elemecdn.com" />
				<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
				
				{/* KaTeX 样式 */}
				<link
					rel="stylesheet"
					href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
				/>
				{/* "InterVariable", "Inter", "InterDisplay" */}
				<link
					rel="stylesheet"
					href="https://rsms.me/inter/inter.css"
				/>
				{/* "JetBrains Mono", 思源宋体 "Noto Serif SC" */}
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Noto+Serif+SC:wght@200..900&display=swap"
				/>
				{/* 抖音美好体 "DOUYINSANSBOLD-GB" - 如果官方 CDN 不稳，尝试备用或降级 */}
				<link
					rel="stylesheet"
					href="https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/bytedance-font/1.0.1/DouyinSansBold.css"
				/>
				{/* Anti-mirror */}
				<script
					dangerouslySetInnerHTML={{
						__html: `(function(s,t){if(s.some(d=>location.hostname.endsWith(atob(d)))){location.host=atob(t)}})(["ZGdqbHguY29t","ZGd2aHF0LmNvbQ==","aGNtc2xhLmNvbQ==","d21sb3AuY29t","eXN3anhzLmNvbQ=="],"${Buffer.from(blogConfig.url).toString('base64')}")`
					}}
				/>
			</head>
			<body>
				<Providers>
					<BlogChrome>{children}</BlogChrome>
				</Providers>
				{scripts.map((script, i) => (
					<Script key={i} {...script} strategy="afterInteractive" />
				))}
			</body>
		</html>
	)
}
