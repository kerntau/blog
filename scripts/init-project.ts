#!/usr/bin/env node

import fs from 'node:fs'
import process from 'node:process'
import { intro, log, outro, spinner, text } from '@clack/prompts'
import { Temporal } from 'temporal-polyfill'

intro('初始化博客：删除原有文章、配置')

const confirm = await text({
	message: '此操作会导致所有文章、配置文件丢失！输入“confirm”确认',
})

if (confirm !== 'confirm') {
	log.error('已取消')
	process.exit(1)
}

const s = spinner()
s.start('正在处理文章、配置文件...')

// 清空 content 目录并新建示例文章
const PATH_LINK_MD = './content/link.md'
const PATH_NEW_DIR = `./content/posts/${Temporal.Now.plainDateISO().year.toString()}`
const linkMdContent = fs.existsSync(PATH_LINK_MD)
	? fs.readFileSync(PATH_LINK_MD, 'utf8')
	: `---\ndate: ${Temporal.Now.plainDateISO().toString()}\n---\n\n- 欢迎交换友链\n`

const defaultExampleContent = `---
title: 你好，世界
date: ${Temporal.Now.plainDateISO().toString()}
description: 这是你的第一篇博客文章。
---

欢迎使用博客系统！你可以开始在 \`content/posts\` 目录下书写你的文章。
`

fs.rmSync('./content', { recursive: true, force: true })
fs.mkdirSync(PATH_NEW_DIR, { recursive: true })
fs.writeFileSync(PATH_LINK_MD, linkMdContent)
fs.writeFileSync(`${PATH_NEW_DIR}/hello-world.md`, defaultExampleContent)

// 处理 app.config.ts
const PATH_APP_CONFIG = './src/app.config.ts'
if (fs.existsSync(PATH_APP_CONFIG)) {
	const appConfigContent = fs.readFileSync(PATH_APP_CONFIG, 'utf8')
		.replace(/'.*?avatar.com.*?'/, 'blogConfig.author.avatar')
		.replace(/'.?ICP备.*?'/, '\'备案\'')
	fs.writeFileSync(PATH_APP_CONFIG, appConfigContent)
}

// 处理 blog.config.ts
const PATH_BLOG_CONFIG = './blog.config.ts'
if (fs.existsSync(PATH_BLOG_CONFIG)) {
	const blogConfigContent = fs.readFileSync(PATH_BLOG_CONFIG, 'utf8')
		.replace(/'[^']*纸鹿[^']*'/g, '\'博客\'')
	fs.writeFileSync(PATH_BLOG_CONFIG, blogConfigContent)
}

s.stop('初始化完成')

outro('请参照 README.md 完成后续配置')
