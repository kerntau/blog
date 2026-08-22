import React, { useState } from 'react'
import { Icon } from '@iconify/react'

export interface DevicePreviewFrameProps {
	children: React.ReactNode
	title?: string
	showThemeToggle?: boolean
	externalUrl?: string
	onRefresh?: () => void
}

export type DeviceType = 'desktop-1440' | 'desktop-1280' | 'tablet-1024' | 'tablet-768' | 'mobile-430' | 'mobile-390' | 'mobile-375' | 'responsive'
export type ScaleType = 'fit' | '100' | '75' | '50'

const DEVICE_SPECS: Record<DeviceType, { label: string, width: number | '100%', icon: string }> = {
	'responsive': { label: '自适应容器', width: '100%', icon: 'tabler:arrows-maximize' },
	'desktop-1440': { label: '桌面 1440px', width: 1440, icon: 'tabler:device-desktop' },
	'desktop-1280': { label: '笔记本 1280px', width: 1280, icon: 'tabler:device-laptop' },
	'tablet-1024': { label: '平板横屏 1024px', width: 1024, icon: 'tabler:device-tablet' },
	'tablet-768': { label: '平板竖屏 768px', width: 768, icon: 'tabler:device-tablet' },
	'mobile-430': { label: 'Pro Max 430px', width: 430, icon: 'tabler:device-mobile' },
	'mobile-390': { label: '手机 390px', width: 390, icon: 'tabler:device-mobile' },
	'mobile-375': { label: 'SE 375px', width: 375, icon: 'tabler:device-mobile' },
}

export const DevicePreviewFrame: React.FC<DevicePreviewFrameProps> = ({
	children,
	title = '实时同源预览',
	showThemeToggle = true,
	externalUrl,
	onRefresh,
}) => {
	const [device, setDevice] = useState<DeviceType>('responsive')
	const [scale, setScale] = useState<ScaleType>('fit')
	const [localTheme, setLocalTheme] = useState<'light' | 'dark'>('light')

	const currentSpec = DEVICE_SPECS[device]
	const isMobileOrTablet = device.startsWith('mobile') || device.startsWith('tablet')

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				background: 'var(--admin-bg)',
				borderRadius: 8,
				border: '1px solid var(--admin-border)',
				overflow: 'hidden',
			}}
		>
			{/* 视口控制顶栏 */}
			<div
				style={{
					padding: '6px 12px',
					background: 'var(--admin-surface)',
					borderBottom: '1px solid var(--admin-border)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 8,
					flexWrap: 'wrap',
					flexShrink: 0,
				}}
			>
				{/* 左侧：标题与设备切换 */}
				<div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--admin-text-1)' }}>
						<Icon icon="tabler:eye" style={{ color: 'var(--admin-accent)' }} />
						<span>{title}</span>
					</div>

					<div style={{ display: 'flex', background: 'var(--admin-bg-subtle)', padding: 2, borderRadius: 6, border: '1px solid var(--admin-border)', gap: 2 }}>
						<button
							type="button"
							className={`admin-btn ${device === 'responsive' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setDevice('responsive')}
							title="自适应容器"
							style={{ padding: '0 6px', height: 24, fontSize: 11 }}
						>
							<Icon icon="tabler:arrows-maximize" />
						</button>
						<button
							type="button"
							className={`admin-btn ${device === 'desktop-1440' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setDevice('desktop-1440')}
							title="桌面 PC (1440px)"
							style={{ padding: '0 6px', height: 24, fontSize: 11 }}
						>
							<Icon icon="tabler:device-desktop" />
						</button>
						<button
							type="button"
							className={`admin-btn ${device === 'tablet-768' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setDevice('tablet-768')}
							title="平板 Tablet (768px)"
							style={{ padding: '0 6px', height: 24, fontSize: 11 }}
						>
							<Icon icon="tabler:device-tablet" />
						</button>
						<button
							type="button"
							className={`admin-btn ${device === 'mobile-390' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setDevice('mobile-390')}
							title="移动端 Mobile (390px)"
							style={{ padding: '0 6px', height: 24, fontSize: 11 }}
						>
							<Icon icon="tabler:device-mobile" />
						</button>
					</div>

					{/* 规格下拉 */}
					<select
						className="admin-select"
						value={device}
						onChange={e => setDevice(e.target.value as DeviceType)}
						style={{ height: 24, fontSize: 11, padding: '0 6px', width: 130 }}
					>
						<option value="responsive">自适应 (100%)</option>
						<option value="desktop-1440">桌面 (1440px)</option>
						<option value="desktop-1280">笔记本 (1280px)</option>
						<option value="tablet-1024">平板横屏 (1024px)</option>
						<option value="tablet-768">平板竖屏 (768px)</option>
						<option value="mobile-430">手机 Max (430px)</option>
						<option value="mobile-390">手机标准 (390px)</option>
						<option value="mobile-375">手机小型 (375px)</option>
					</select>
				</div>

				{/* 右侧：缩放、主题切换与操作 */}
				<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
					<div style={{ display: 'flex', background: 'var(--admin-bg-subtle)', padding: 2, borderRadius: 6, border: '1px solid var(--admin-border)', gap: 2 }}>
						{(['fit', '100', '75', '50'] as ScaleType[]).map(s => (
							<button
								key={s}
								type="button"
								className={`admin-btn ${scale === s ? 'btn-primary' : 'btn-ghost'} btn-sm`}
								onClick={() => setScale(s)}
								style={{ padding: '0 6px', height: 24, fontSize: 10 }}
								title={`缩放比例: ${s === 'fit' ? '自适应' : `${s}%`}`}
							>
								{s === 'fit' ? 'Fit' : `${s}%`}
							</button>
						))}
					</div>

					{showThemeToggle && (
						<button
							type="button"
							className="admin-btn btn-ghost btn-sm"
							onClick={() => setLocalTheme(localTheme === 'dark' ? 'light' : 'dark')}
							title={`当前预览主题: ${localTheme === 'dark' ? '深色模式' : '浅色模式'}`}
							style={{ height: 24, padding: '0 6px' }}
						>
							<Icon icon={localTheme === 'dark' ? 'tabler:sun' : 'tabler:moon'} />
						</button>
					)}

					{onRefresh && (
						<button
							type="button"
							className="admin-btn btn-ghost btn-sm"
							onClick={onRefresh}
							title="刷新预览"
							style={{ height: 24, padding: '0 6px' }}
						>
							<Icon icon="tabler:refresh" />
						</button>
					)}

					{externalUrl && (
						<a
							href={externalUrl}
							target="_blank"
							rel="noreferrer"
							className="admin-btn btn-secondary btn-sm"
							title="在新窗口中全屏打开"
							style={{ height: 24, padding: '0 8px', textDecoration: 'none' }}
						>
							<Icon icon="tabler:external-link" />
							<span style={{ fontSize: 11 }}>新窗口</span>
						</a>
					)}
				</div>
			</div>

			{/* 视口舞台容器 */}
			<div
				style={{
					flex: 1,
					overflow: 'auto',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'flex-start',
					padding: device === 'responsive' ? 0 : 16,
					background: device === 'responsive' ? 'transparent' : 'rgba(0, 0, 0, 0.05)',
				}}
			>
				<div
					data-theme={localTheme}
					className={localTheme === 'dark' ? 'dark' : ''}
					style={{
						width: currentSpec.width,
						maxWidth: '100%',
						minHeight: device === 'responsive' ? '100%' : '80vh',
						height: device === 'responsive' ? '100%' : undefined,
						background: 'var(--admin-bg)',
						color: 'var(--admin-text-1)',
						borderRadius: isMobileOrTablet ? 16 : 0,
						border: isMobileOrTablet ? '4px solid var(--admin-border)' : undefined,
						boxShadow: device !== 'responsive' ? '0 12px 36px rgba(0, 0, 0, 0.15)' : undefined,
						transform: scale === 'fit' || scale === '100' ? undefined : `scale(${Number(scale) / 100})`,
						transformOrigin: 'top center',
						transition: 'all 0.2s ease',
						overflowY: 'auto',
						overflowX: 'hidden',
						display: 'flex',
						flexDirection: 'column',
					}}
				>
					{children}
				</div>
			</div>
		</div>
	)
}

export default DevicePreviewFrame
