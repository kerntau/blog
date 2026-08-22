import { Routes, Route } from 'react-router-dom'
import BlogChrome from './components/blog/BlogChrome'
import HomePage from './pages/HomePage'
import ArchivePage from './pages/ArchivePage'
import LinkPage from './pages/LinkPage'
import PreviewPage from './pages/PreviewPage'
import PostPage from './pages/PostPage'
import AdminApp from './admin/AdminApp'

export function AppRoutes() {
	return (
		<Routes>
			{/* 独立后台管理系统路由（彻底独立，绝不嵌套在前台博客布局中） */}
			<Route path="/admin/*" element={<AdminApp />} />
			<Route path="/admin" element={<AdminApp />} />

			{/* 前台博客页面路由（由 BlogChrome 提供博客导航、侧栏与页脚） */}
			<Route
				path="/"
				element={(
					<BlogChrome>
						<HomePage />
					</BlogChrome>
				)}
			/>
			<Route
				path="/archive"
				element={(
					<BlogChrome>
						<ArchivePage />
					</BlogChrome>
				)}
			/>
			<Route
				path="/link"
				element={(
					<BlogChrome>
						<LinkPage />
					</BlogChrome>
				)}
			/>
			<Route
				path="/preview"
				element={(
					<BlogChrome>
						<PreviewPage />
					</BlogChrome>
				)}
			/>

			{/* 文章详情动态通配路由 */}
			<Route
				path="*"
				element={(
					<BlogChrome>
						<PostPage />
					</BlogChrome>
				)}
			/>
		</Routes>
	)
}

export default AppRoutes
