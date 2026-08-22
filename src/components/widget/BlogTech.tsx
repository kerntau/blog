'use client'

import { useState } from 'react'
import { Icon } from '@iconify/react'
import BlogWidget from '../blog/BlogWidget'
import ZDlGroup from '../partial/ZDlGroup'
import ZExpand from '../partial/ZExpand'
import appConfig from '../../app.config'
import packageJson from '../../../package.json'
import styles from './BlogTech.module.scss'

export default function BlogTech() {
	const [expand, setExpand] = useState(false)

	const service = [
		{ label: '部署平台', value: () => <span><Icon icon="ri:tencent-cloud-fill" /> EdgeOne</span> },
		{ label: '图片存储', value: () => <span><Icon icon="tabler:photo-up" /> 图仓</span> },
		{ label: '软件协议', value: 'MIT' },
		{ label: '文章许可', value: appConfig.copyright.abbr },
		{ label: '规范域名', value: 'cot.wiki' },
	]

	const techstack = [
		{ label: 'React', value: packageJson.dependencies.react },
		{ label: 'Rsbuild', value: (packageJson.devDependencies as any)['@rsbuild/core'] || '^2.0.0' },
		{ label: 'Node', value: packageJson.engines.node },
		{ label: 'pnpm', value: packageJson.packageManager?.split('@')[1] || '--' },
	]

	return (
		<BlogWidget card grayscale title="技术信息" className={styles.techWidget}>
			<ZDlGroup items={service} />
			<ZExpand inPlace name="构建信息" value={expand} onChange={setExpand}>
				<ZDlGroup size="small" items={techstack} />
			</ZExpand>
		</BlogWidget>
	)
}
