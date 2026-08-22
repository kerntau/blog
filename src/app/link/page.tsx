import { getCompiledMDX } from '../../lib/mdx'
import LinkClient from './LinkClient'
import type { Metadata } from 'next'
import appConfig from '../../../blog.config'

export const metadata: Metadata = {
	title: '友链',
	description: `${appConfig.title}的友链页面，收集了添加他为友链的网站和他订阅的网站列表。`,
}

export default async function LinkPage() {
	const mdx = await getCompiledMDX('/link')
	return <LinkClient mdx={mdx} />
}
