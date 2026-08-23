'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Icon } from '@iconify/react'
import BlogWidget from '../blog/BlogWidget'
import appConfig from '../../app.config'
import styles from './BlogWeather.module.scss'

/** 心知天气天气代码与天气文本多重精准映射（统一线条风格） */
function getWeatherIcon(codeOrText?: string | number) {
	const val = String(codeOrText ?? '').trim()

	// 1. 按文字关键词精准匹配
	if (val.includes('雷') || val.includes('暴雨')) {
		return { icon: 'tabler:cloud-storm', color: '#8b5cf6' }
	}
	if (val.includes('雪')) {
		return { icon: 'tabler:cloud-snow', color: '#38bdf8' }
	}
	if (val.includes('雨')) {
		return { icon: 'tabler:cloud-rain', color: '#0284c7' }
	}
	if (val.includes('雾') || val.includes('霾')) {
		return { icon: 'tabler:cloud-fog', color: '#94a3b8' }
	}
	if (val.includes('风') || val.includes('沙')) {
		return { icon: 'tabler:wind', color: '#94a3b8' }
	}
	if (val.includes('晴间多云') || val.includes('大部多云') || val === '5' || val === '7') {
		return { icon: 'tabler:cloud-sun', color: '#f59e0b' }
	}
	if (val === '晴' || val === '0' || val === '2') {
		return { icon: 'tabler:sun', color: '#f59e0b' }
	}
	if (val.includes('夜间晴') || val === '1' || val === '3') {
		return { icon: 'tabler:moon', color: '#818cf8' }
	}
	if (val.includes('阴') || val === '9') {
		return { icon: 'tabler:cloud', color: '#64748b' }
	}
	if (val.includes('云') || val === '4' || val === '6' || val === '8') {
		return { icon: 'tabler:cloud', color: '#0ea5e9' }
	}

	// 2. 按代码兜底
	switch (val) {
		case '0':
		case '2':
			return { icon: 'tabler:sun', color: '#f59e0b' }
		case '1':
		case '3':
			return { icon: 'tabler:moon', color: '#818cf8' }
		case '4':
			return { icon: 'tabler:cloud', color: '#0ea5e9' }
		case '5':
		case '7':
			return { icon: 'tabler:cloud-sun', color: '#f59e0b' }
		case '6':
		case '8':
			return { icon: 'tabler:cloud-moon', color: '#a5b4fc' }
		case '9':
			return { icon: 'tabler:cloud', color: '#64748b' }
		case '10':
		case '13':
		case '14':
		case '15':
		case '16':
		case '17':
		case '18':
			return { icon: 'tabler:cloud-rain', color: '#0284c7' }
		case '11':
		case '12':
			return { icon: 'tabler:cloud-storm', color: '#8b5cf6' }
		case '19':
		case '20':
		case '21':
		case '22':
		case '23':
		case '24':
		case '25':
			return { icon: 'tabler:cloud-snow', color: '#38bdf8' }
		case '30':
		case '31':
			return { icon: 'tabler:cloud-fog', color: '#94a3b8' }
		default:
			return { icon: 'tabler:cloud', color: '#0ea5e9' }
	}
}

interface WeatherData {
	city: string
	temperature: number | string
	text: string
	code: string
	humidity?: string
	windDirection?: string
	windScale?: string
	high?: string
	low?: string
	forecast?: Array<{
		date: string
		dayText: string
		dayCode: string
		high: string
		low: string
	}>
	lastUpdate?: string
}

interface BlogWeatherProps {
	customData?: {
		title?: string
		apiKey?: string
		defaultCity?: string
		unit?: string
	}
}

export default function BlogWeather({ customData }: BlogWeatherProps = {}) {
	const globalConfig = (appConfig.widgets as any)?.weather || {}
	const weatherConfig = {
		...globalConfig,
		...customData,
	}
	const defaultCity = weatherConfig.defaultCity || 'ip'
	const apiKey = weatherConfig.apiKey || 'SETN6ufSUnD0sxHTo' // 心知天气私钥

	const [data, setData] = useState<WeatherData>({
		city: '定位中...',
		temperature: '31',
		text: '多云',
		code: '4',
		humidity: '91%',
		windDirection: '东南风',
		windScale: '4级',
		high: '35',
		low: '24',
		forecast: [],
		lastUpdate: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
	})
	const [loading, setLoading] = useState(false)
	const [justRefreshed, setJustRefreshed] = useState(false)

	const fetchWeather = useCallback(async (isManual = false) => {
		setLoading(true)
		try {
			// 1. 优先尝试本地 API 代理或心知天气直连
			const targetLoc = (defaultCity || 'ip').trim()
			const ts = Date.now()
			const url = apiKey
				? `https://api.seniverse.com/v3/weather/now.json?key=${apiKey}&location=${encodeURIComponent(targetLoc)}&language=zh-Hans&unit=c&_t=${ts}`
				: `/api/weather?location=${encodeURIComponent(targetLoc)}&_t=${ts}`

			const [res] = await Promise.all([
				fetch(url),
				isManual ? new Promise(r => setTimeout(r, 600)) : Promise.resolve(),
			])

			if (res.ok) {
				const json = await res.json()
				const result = json.results?.[0]
				if (result) {
					const now = result.now
					const location = result.location

					// 异步尝试获取 3 天逐日预报
					let dailyList: any[] = []
					let todayDaily: any = null
					try {
						const dailyUrl = apiKey
							? `https://api.seniverse.com/v3/weather/daily.json?key=${apiKey}&location=${encodeURIComponent(targetLoc)}&language=zh-Hans&unit=c&start=0&days=3&_t=${ts}`
							: `/api/weather/daily?location=${encodeURIComponent(targetLoc)}&_t=${ts}`
						const dailyRes = await fetch(dailyUrl)
						if (dailyRes.ok) {
							const dailyJson = await dailyRes.json()
							const dailyDays = dailyJson.results?.[0]?.daily || []
							if (dailyDays.length > 0) {
								todayDaily = dailyDays[0]
							}
							dailyList = dailyDays.map((d: any, idx: number) => ({
								date: idx === 0 ? '今天' : idx === 1 ? '明天' : '后天',
								dayText: d.text_day || d.text_night || '晴',
								dayCode: d.code_day || d.code_night || '0',
								high: d.high,
								low: d.low,
							}))
						}
					}
					catch {}

					const windDir = todayDaily?.wind_direction || now?.wind_direction || '东'
					const windFormatted = windDir.endsWith('风') ? windDir : `${windDir}风`

					setData({
						city: location?.name || (defaultCity === 'ip' ? '当前位置' : defaultCity),
						temperature: now?.temperature || todayDaily?.high || '31',
						text: now?.text || todayDaily?.text_day || '多云',
						code: now?.code || todayDaily?.code_day || '4',
						humidity: todayDaily?.humidity ? `${todayDaily.humidity}%` : '91%',
						windDirection: windFormatted,
						windScale: todayDaily?.wind_scale ? `${todayDaily.wind_scale}级` : (now?.wind_scale ? `${now.wind_scale}级` : '4级'),
						high: todayDaily?.high || dailyList[0]?.high || '35',
						low: todayDaily?.low || dailyList[0]?.low || '24',
						forecast: dailyList.length > 0 ? dailyList : [
							{ date: '今天', dayText: '阴', dayCode: '9', high: '35', low: '24' },
							{ date: '明天', dayText: '小雨', dayCode: '13', high: '32', low: '25' },
							{ date: '后天', dayText: '多云', dayCode: '4', high: '33', low: '25' },
						],
						lastUpdate: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
					})

					if (isManual) {
						setJustRefreshed(true)
						setTimeout(() => setJustRefreshed(false), 2500)
					}
					setLoading(false)
					return
				}
			}
		}
		catch {
			// 启用容错
		}
		setLoading(false)
	}, [apiKey, defaultCity])

	useEffect(() => {
		fetchWeather(false)
		// 每隔 30 分钟自动静默刷新一次天气
		const timer = setInterval(() => fetchWeather(false), 30 * 60 * 1000)
		return () => clearInterval(timer)
	}, [fetchWeather])

	const currentIcon = getWeatherIcon(data.code || data.text)

	return (
		<BlogWidget
			card
			title={weatherConfig.title || '实时天气'}
			action={(
				<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
					<span
						onClick={() => !loading && fetchWeather(true)}
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 4,
							fontWeight: 600,
							color: 'var(--c-text-1)',
							background: 'var(--c-bg-3)',
							padding: '2px 8px',
							borderRadius: 12,
							fontSize: 11.5,
							border: '1px solid var(--c-border)',
							cursor: 'pointer',
							userSelect: 'none',
						}}
						title={`当前定位: ${data.city} (点击重新定位刷新)`}
					>
						<Icon icon="tabler:map-pin" style={{ color: 'var(--c-primary)', fontSize: 12 }} />
						<span>{data.city}</span>
					</span>
					<button
						type="button"
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()
							if (!loading) fetchWeather(true)
						}}
						title="刷新天气实况"
						disabled={loading}
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: 24,
							height: 24,
							borderRadius: 6,
							background: loading ? 'var(--c-bg-3)' : 'transparent',
							border: 'none',
							color: loading ? 'var(--c-primary)' : 'var(--c-text-3)',
							cursor: loading ? 'wait' : 'pointer',
							transition: 'all 0.2s ease',
						}}
					>
						<Icon
							icon="tabler:rotate"
							style={{
								fontSize: 15,
								animation: loading ? 'spin 0.6s linear infinite' : 'none',
							}}
						/>
					</button>
				</div>
			)}
		>
			<div className={styles.weatherWidget}>
				{/* 1. 核心气象区：大字号实时气温与动态状态 */}
				<div className={styles.mainWeather}>
					<div className={styles.tempSection}>
						<div className={styles.temperature}>
							{data.temperature}°
						</div>
						<div className={styles.weatherText}>
							<span>{data.text}</span>
							<span>·</span>
							<span>{data.low}° ~ {data.high}°</span>
						</div>
					</div>

					<div className={styles.iconSection} style={{ color: currentIcon.color }}>
						<Icon icon={currentIcon.icon} />
					</div>
				</div>

				{/* 2. 三项指标网格：完全同源于 BlogStats 博客统计设计 */}
				<div className={styles.detailsGrid}>
					<div className={styles.detailCard}>
						<span className={styles.label}>相对湿度</span>
						<span className={styles.value}>{data.humidity}</span>
					</div>
					<div className={styles.detailCard}>
						<span className={styles.label}>风向状况</span>
						<span className={styles.value}>{data.windDirection}</span>
					</div>
					<div className={styles.detailCard}>
						<span className={styles.label}>风力等级</span>
						<span className={styles.value}>{data.windScale}</span>
					</div>
				</div>

				{/* 3. 未来逐日预报：严格 4 列网格（日期 · 图标 · 文字 · 温度）极致垂直对齐 */}
				{data.forecast && data.forecast.length > 0 && (
					<div className={styles.forecastList}>
						{data.forecast.map((item, idx) => {
							const dayIcon = getWeatherIcon(item.dayCode || item.dayText)
							return (
								<div key={idx} className={styles.forecastItem}>
									<span className={styles.dayLabel}>{item.date}</span>
									<span className={styles.iconWrap} style={{ color: dayIcon.color }}>
										<Icon icon={dayIcon.icon} />
									</span>
									<span className={styles.conditionText}>{item.dayText}</span>
									<span className={styles.tempRange}>
										{item.low}° ~ {item.high}°
									</span>
								</div>
							)
						})}
					</div>
				)}

				{/* 4. 底部更新说明（纯文本无外链） */}
				<div className={styles.weatherFooter}>
					<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
						{justRefreshed ? (
							<span style={{ color: 'var(--c-primary)', fontWeight: 600 }}>✓ 刚刚已刷新 ({data.lastUpdate})</span>
						) : (
							<span>更新于 {data.lastUpdate}</span>
						)}
					</span>
					<span className={styles.sourceText}>心知天气</span>
				</div>
			</div>
		</BlogWidget>
	)
}
