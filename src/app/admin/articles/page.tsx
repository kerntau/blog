/* eslint-disable style/max-statements-per-line */
import { getAdminOverview } from '@/lib/admin'
import ArticlesClient from './ArticlesClient'

export default function ArticlesPage() { return <ArticlesClient posts={getAdminOverview().posts.map(post => ({ title: post.title || '未命名文章', path: `/${post._stem}`, publicPath: post.path, date: String(post.updated || post.date || ''), draft: Boolean(post.draft), categories: post.categories ?? [] }))} /> }
