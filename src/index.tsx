import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import Clarity from '@microsoft/clarity'
import AppRoutes from './routes'

// 导入全局与基础样式
import './assets/css/animation.scss'
import './assets/css/article.scss'
import './assets/css/color.scss'
import './assets/css/font.scss'
import './assets/css/main.scss'
import './assets/css/reusable.scss'
import './assets/css/layout.scss'

// 初始化 Microsoft Clarity
Clarity.init('xtzn5yniki')

const rootElement = document.getElementById('blog-root')

if (rootElement) {
	const root = ReactDOM.createRoot(rootElement)
	root.render(
		<React.StrictMode>
			<BrowserRouter>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<AppRoutes />
				</ThemeProvider>
			</BrowserRouter>
		</React.StrictMode>,
	)
}
