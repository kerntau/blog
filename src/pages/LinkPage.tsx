import { useEffect, useMemo } from 'react'
import { getCompiledMDX } from '@/lib/mdx'
import { useLayoutStore } from '@/stores/layout'
import FeedGroup from '@/components/content/FeedGroup'
import FeedCard from '@/components/content/FeedCard'
import Tab from '@/components/content/Tab'
import Copy from '@/components/content/Copy'
import BlogHeader from '@/components/blog/BlogHeader'
import feeds from '@/feeds'
import { myFeed } from '../../blog.config'
import appConfig from '@/app.config'
import PostComment from '@/components/post/PostComment'
import styles from './LinkPage.module.scss'

export default function LinkPage() {
	const mdx = useMemo(() => getCompiledMDX('/link'), [])
	const setAside = useLayoutStore(s => s.setAside)

	useEffect(() => {
		setAside([])
	}, [setAside])

	const copyFields = {
		作者: myFeed.author,
		标题: myFeed.title,
		描述: myFeed.desc,
		地址: myFeed.link,
		头像: myFeed.avatar,
	}

	return (
		<div className="link-page proper-height">
			<div className="mobile-only">
				<BlogHeader as="h1" suffix="友链" />
			</div>

			{feeds.map((group) => (
				<FeedGroup
					key={group.name}
					{...group}
					shuffle={appConfig.link.randomInGroup}
				/>
			))}

			<Tab tabs={['我的博客信息', '申请说明']} center>
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
						<p className="text-center">请新建 link.md 说明</p>
					)}
				</div>
			</Tab>

			<PostComment />
		</div>
	)
}
