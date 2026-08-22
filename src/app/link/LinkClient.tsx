'use client'

import { useEffect } from 'react'
import { useLayoutStore } from '../../stores/layout'
import FeedGroup from '../../components/content/FeedGroup'
import FeedCard from '../../components/content/FeedCard'
import Tab from '../../components/content/Tab'
import Copy from '../../components/content/Copy'
import BlogHeader from '../../components/blog/BlogHeader'
import feeds from '../../feeds'
import { myFeed } from '../../../blog.config'
import appConfig from '../../app.config'
import styles from './LinkClient.module.scss'

export default function LinkClient({ mdx }: { mdx: any }) {
	const setAside = useLayoutStore(s => s.setAside)
	useEffect(() => {
		setAside([])
	}, [setAside])

	const copyFields = {
		博主: myFeed.author,
		标题: myFeed.title,
		介绍: myFeed.desc,
		网址: myFeed.link,
		头像: myFeed.avatar,
	}

	return (
		<div className="link-page proper-height">
			<div className="mobile-only">
				<BlogHeader as="h1" />
			</div>

			{feeds.map((group) => (
				<FeedGroup
					key={group.name}
					{...group}
					shuffle={appConfig.link.randomInGroup}
				/>
			))}

			<Tab tabs={['我的博客信息', '申请友链']} center>
				<div slot="tab1" className={styles.linkTab}>
					<FeedCard {...myFeed} />
					{Object.entries(copyFields).map(([prompt, code]) => (
						<Copy key={prompt} prompt={prompt} code={code as string} />
					))}
				</div>
				<div slot="tab2" className={styles.linkTab}>
					{mdx ? (
						<article className="article">
							{mdx.content}
						</article>
					) : (
						<p className="text-center">可于 link.md 配置友链补充说明。</p>
					)}
				</div>
			</Tab>
		</div>
	)
}
