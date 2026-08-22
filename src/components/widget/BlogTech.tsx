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

interface BlogTechProps {
	customData?: {
		title?: string
		services?: Array<{ label: string, value: string, icon?: string, iconColor?: string }>
		techstack?: Array<{ name: string, version: string, icon: string, iconColor?: string }>
	}
}

export default function BlogTech({ customData }: BlogTechProps = {}) {
	const [expand, setExpand] = useState(false)

	const techConfig = customData || (appConfig as any).widgets?.tech

	const title = techConfig?.title || '技术信息'

	const rawServices = techConfig?.services || [
		{ label: '部署平台', value: 'EdgeOne', icon: 'ri:tencent-cloud-fill', iconColor: '#0052D9' },
		{ label: '图片存储', value: 'Cloudflare R2', icon: 'devicon:cloudflare' },
		{ label: '开源协议', value: 'MIT', icon: 'tabler:license', iconColor: '#F59E0B' },
		{ label: '文章许可', value: appConfig.copyright.abbr },
		{ label: '规范域名', value: getDomain(appConfig.url) || 'cot.wiki' },
	]

	const service = rawServices.map((s: any) => ({
		label: s.label,
		value: () => {
			if (s.icon) {
				return (
					<span className={styles.valWithIcon}>
						<Icon icon={s.icon} style={s.iconColor ? { color: s.iconColor } : undefined} />
						<span>{s.value}</span>
					</span>
				)
			}
			return s.value
		},
	}))

	const techstack = techConfig?.techstack || [
		{ icon: 'logos:react', name: 'React', version: packageJson.dependencies.react },
		{ icon: 'tabler:bolt', iconColor: '#F85D00', name: 'Rsbuild', version: (packageJson.devDependencies as any)['@rsbuild/core'] || '^2.1.13' },
		{ icon: 'devicon:typescript', name: 'TS', version: packageJson.devDependencies.typescript },
		{ icon: 'simple-icons:mdx', iconColor: '#FCB32C', name: 'MDX', version: packageJson.dependencies['@mdx-js/mdx'] },
		{ icon: 'logos:nodejs-icon', name: 'Node', version: packageJson.engines.node },
		{ icon: 'logos:pnpm', name: 'pnpm', version: packageJson.packageManager?.split('@')[1] || '11.0.4' },
		{ icon: 'simple-icons:framer', iconColor: '#0055FF', name: 'Motion', version: packageJson.dependencies['framer-motion'] },
		{ icon: 'logos:sass', name: 'Sass', version: packageJson.devDependencies['sass-embedded'] || '^1.99.0' },
	]

	return (
		<BlogWidget card grayscale title={title} className={styles.techWidget}>
			<ZDlGroup items={service} />
			<ZExpand inPlace name="构建信息" value={expand} onChange={setExpand}>
				<div className={styles.techGrid}>
					{techstack.map((tech: any, i: number) => (
						<div key={i} className={styles.techItem}>
							<div className={styles.techLabel}>
								<span className={styles.techIcon}>
									<Icon icon={tech.icon} style={tech.iconColor ? { color: tech.iconColor } : undefined} />
								</span>
								<span className={styles.techName}>{tech.name}</span>
							</div>
							<div className={styles.techVal}>{tech.version}</div>
						</div>
					))}
				</div>
			</ZExpand>
		</BlogWidget>
	)
}
