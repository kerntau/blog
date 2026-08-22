'use client'

import { useState } from 'react'
import { Icon } from '@iconify/react'
import BlogWidget from '../blog/BlogWidget'
import ZDlGroup from '../partial/ZDlGroup'
import ZExpand from '../partial/ZExpand'
import appConfig from '../../app.config'
import { getDomain } from '../../utils/link'
import packageJson from '../../../package.json'
import styles from './BlogTech.module.scss'

export default function BlogTech() {
	const [expand, setExpand] = useState(false)

	const service = [
		{
			label: '部署平台',
			value: () => (
				<span className={styles.valWithIcon}>
					<Icon icon="ri:tencent-cloud-fill" style={{ color: '#0052D9' }} />
					<span>EdgeOne</span>
				</span>
			),
		},
		{
			label: '图片存储',
			value: () => (
				<span className={styles.valWithIcon}>
					<Icon icon="devicon:cloudflare" />
					<span>Cloudflare R2</span>
				</span>
			),
		},
		{
			label: '开源协议',
			value: () => (
				<span className={styles.valWithIcon}>
					<Icon icon="tabler:license" style={{ color: '#F59E0B' }} />
					<span>MIT</span>
				</span>
			),
		},
		{
			label: '文章许可',
			value: appConfig.copyright.abbr,
		},
		{
			label: '规范域名',
			value: getDomain(appConfig.url) || 'cot.wiki',
		},
	]

	const techstack = [
		{
			icon: 'logos:react',
			name: 'React',
			version: packageJson.dependencies.react,
		},
		{
			icon: 'tabler:bolt',
			iconColor: '#F85D00',
			name: 'Rsbuild',
			version: (packageJson.devDependencies as any)['@rsbuild/core'] || '^2.1.13',
		},
		{
			icon: 'logos:typescript-icon',
			name: 'TS',
			version: packageJson.devDependencies.typescript,
		},
		{
			icon: 'simple-icons:mdx',
			iconColor: '#FCB32C',
			name: 'MDX',
			version: packageJson.dependencies['@mdx-js/mdx'],
		},
		{
			icon: 'logos:nodejs-icon',
			name: 'Node',
			version: packageJson.engines.node,
		},
		{
			icon: 'logos:pnpm',
			name: 'pnpm',
			version: packageJson.packageManager?.split('@')[1] || '11.0.4',
		},
		{
			icon: 'simple-icons:framer',
			iconColor: '#0055FF',
			name: 'Motion',
			version: packageJson.dependencies['framer-motion'],
		},
		{
			icon: 'logos:sass',
			name: 'Sass',
			version: packageJson.devDependencies['sass-embedded'] || '^1.99.0',
		},
	]

	return (
		<BlogWidget card grayscale title="技术信息" className={styles.techWidget}>
			<ZDlGroup items={service} />
			<ZExpand inPlace name="构建信息" value={expand} onChange={setExpand}>
				<div className={styles.techGrid}>
					{techstack.map((tech, i) => (
						<div key={i} className={styles.techItem}>
							<div className={styles.techLabel}>
								<Icon icon={tech.icon} style={tech.iconColor ? { color: tech.iconColor } : undefined} />
								<span>{tech.name}</span>
							</div>
							<div className={styles.techVal}>{tech.version}</div>
						</div>
					))}
				</div>
			</ZExpand>
		</BlogWidget>
	)
}
