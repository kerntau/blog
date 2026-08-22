'use client'

import { useState, useEffect, useMemo } from 'react'
import BlogWidget from '../blog/BlogWidget'
import ZDlGroup from '../partial/ZDlGroup'
import UtilDate from '../util/UtilDate'
import { timeElapse } from '../../utils/time'
import { formatNumber } from '../../utils/str'
import appConfig from '../../app.config'

export default function BlogStats() {
	const [stats, setStats] = useState<any>(null)

	useEffect(() => {
		fetch('/api/stats')
			.then(res => res.json())
			.then(data => setStats(data))
			.catch(() => {})
	}, [])

	const yearlyTip = useMemo(() => {
		if (!stats?.annual) return '数据获取失败'
		return Object.entries(stats.annual)
			.reverse()
			.map(([year, item]: any) => `${year}年：${item.posts}篇，${formatNumber(item.words)}字`)
			.join('\n')
	}, [stats])

	const blogStats = [
		{
			label: '运营时长',
			value: timeElapse(appConfig.timeEstablished),
			tip: `博客于${appConfig.timeEstablished}上线`,
		},
		{
			label: '上次更新',
			value: () => (
				<UtilDate
					date={process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString()}
					relative
					tipTransform={date => `构建于${date}`}
				/>
			),
		},
		{
			label: '总字数',
			value: stats?.total?.words ? formatNumber(stats.total.words) : '--',
			tip: yearlyTip,
		}
	]

	return (
		<BlogWidget card title="博客统计">
			<ZDlGroup items={blogStats} size="small" />
		</BlogWidget>
	)
}
