'use client'

import { useState, useEffect, useMemo } from 'react'
import BlogWidget from '../blog/BlogWidget'
import ZDlGroup from '../partial/ZDlGroup'
import UtilDate from '../util/UtilDate'
import { timeElapse } from '../../utils/time'
import { formatNumber } from '../../utils/str'
import appConfig from '../../app.config'

import { getStats } from '../../lib/content'

interface BlogStatsProps {
	customData?: {
		birthYear?: number
		wordCount?: string
	}
}

export default function BlogStats({ customData: _customData }: BlogStatsProps = {}) {
	const initialStats = useMemo(() => getStats(), [])
	const [stats, setStats] = useState<any>(initialStats)

	useEffect(() => {
		fetch('/api/stats.json')
			.then(res => {
				if (!res.ok) return fetch('/api/stats')
				return res
			})
			.then(res => res.json())
			.then(data => {
				if (data?.total?.words) {
					setStats(data)
				} else if (data?.data?.totalWords) {
					setStats({
						total: {
							posts: data.data.publishedCount || data.data.postCount || 0,
							words: data.data.totalWords || 0,
						},
						annual: data.data.years || {},
					})
				}
			})
			.catch(() => {})
	}, [])

	const totalWords = stats?.total?.words || initialStats?.total?.words || 0

	const yearlyTip = useMemo(() => {
		const annual = stats?.annual || initialStats?.annual
		if (!annual || Object.keys(annual).length === 0) return '数据获取失败'
		return Object.entries(annual)
			.reverse()
			.map(([year, item]: any) => `${year}年：${item.posts}篇，${formatNumber(item.words)}字`)
			.join('\n')
	}, [stats, initialStats])

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
			value: totalWords ? `${formatNumber(totalWords)}字` : '0字',
			tip: yearlyTip,
		},
	]

	return (
		<BlogWidget card title="博客统计">
			<ZDlGroup items={blogStats} size="small" />
		</BlogWidget>
	)
}
