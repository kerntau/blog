import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Providers } from './app/providers'
import BlogChrome from './components/blog/BlogChrome'
import AppRoutes from './routes'

// 导入全局与基础样式
import './assets/css/animation.scss'
import './assets/css/article.scss'
import './assets/css/color.scss'
import './assets/css/font.scss'
import './assets/css/main.scss'
import './assets/css/migration-components.scss'
import './assets/css/reusable.scss'
import './app/layout.scss'

const rootElement = document.getElementById('root')

if (rootElement) {
	const root = ReactDOM.createRoot(rootElement)
	root.render(
		<React.StrictMode>
			<BrowserRouter>
				<Providers>
					<BlogChrome>
						<AppRoutes />
					</BlogChrome>
				</Providers>
			</BrowserRouter>
		</React.StrictMode>,
	)
}
