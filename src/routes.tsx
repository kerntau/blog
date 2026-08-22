import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ArchivePage from './pages/ArchivePage'
import LinkPage from './pages/LinkPage'
import PreviewPage from './pages/PreviewPage'
import PostPage from './pages/PostPage'

export function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/archive" element={<ArchivePage />} />
			<Route path="/link" element={<LinkPage />} />
			<Route path="/preview" element={<PreviewPage />} />

			{/* 文章详情动态通配路由 */}
			<Route path="*" element={<PostPage />} />
		</Routes>
	)
}

export default AppRoutes
