'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { Temporal } from 'temporal-polyfill'
import { toZonedTemporal, toInstantString, toZdtLocaleString, type dateTimeFormatOptions } from '../../utils/time'
// 如果 utils/time 中缺少了类型，可暂时忽略或引入正确的

interface UtilDateProps {
	icon?: string
	date?: string | Temporal.ZonedDateTime
	format?: dateTimeFormatOptions
	absolute?: boolean
	relative?: boolean
	nospace?: boolean
	tipFormat?: dateTimeFormatOptions
	tipTransform?: (formattedDate: string) => string
	className?: string
}

export default function UtilDate({
	icon,
	date,
	format,
	absolute,
	relative,
	nospace,
	tipFormat,
	tipTransform = String,
	className = ''
}: UtilDateProps) {
	const [mounted, setMounted] = useState(false)

	useEffect(() => setMounted(true), [])

	const today = Temporal.Now.plainDateISO()
	
	let zdt: Temporal.ZonedDateTime | null = null
	try {
		if (date) {
			zdt = typeof date === 'string' ? toZonedTemporal(date) : date
		}
	} catch {
		zdt = null
	}

	let isRelative = false
	try {
		isRelative = absolute || !zdt
			? false
			: relative || today.since(zdt.toPlainDate(), { largestUnit: 'week' }).weeks < 1
	} catch {
		isRelative = false
	}

	const tooltip = mounted && zdt
		? tipTransform(toZdtLocaleString(zdt, tipFormat))
		: (typeof date === 'string' ? date : '')

	const getRelativeTime = (zdt: Temporal.ZonedDateTime) => {
		// 简单的 relative time fallback
		// 理想情况下应该使用 Intl.RelativeTimeFormat，为了暂时模拟 NuxtTime
		const diffMs = Date.now() - zdt.epochMilliseconds
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
		if (diffDays === 0) return '今天'
		if (diffDays === 1) return '昨天'
		if (diffDays > 1 && diffDays < 7) return `${diffDays} 天前`
		const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' }
		if (zdt.year !== today.year) opts.year = 'numeric'
		return toZdtLocaleString(zdt, opts)
	}

	return (
		<span title={tooltip} className={className}>
			{icon && <Icon icon={icon} />}
			{icon && !nospace && <>&nbsp;</>}

			{!zdt ? (
				<span>Invalid Date</span>
			) : format ? (
				<time dateTime={toInstantString(zdt)}>
					{mounted ? toZdtLocaleString(zdt, format) : ''}
				</time>
			) : (
				<time dateTime={toInstantString(zdt)}>
					{mounted ? (isRelative ? getRelativeTime(zdt) : (() => {
					const o: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' }
					if (zdt!.year !== today.year) o.year = '2-digit'
					return toZdtLocaleString(zdt!, o)
				})()) : ''}
				</time>
			)}
		</span>
	)
}
