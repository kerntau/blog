export function getGithubIcon(name = '') {
	return `https://wsrv.nl/?url=github.com/${encodeURIComponent(name)}.png?size=32&mask=circle`
}

// https://docs.webp.se/public-services/github-avatar/
export function getGithubAvatar(name = '', options = { size: 120 }) {
	return `https://avatars-githubusercontent-webp.webp.se/${encodeURIComponent(name)}?s=${options.size}`
}

export enum OicqAvatarSize {
	Size40 = 40,
	Size100 = 100,
	Size140 = 140,
	Size640 = 640,
}

// https://users.qzone.qq.com/fcg-bin/cgi_get_portrait.fcg?uins=
export function getOicqAvatar(qq = '', size: OicqAvatarSize | number = OicqAvatarSize.Size140) {
	return `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=${size}`
}

export enum QgroupAvatarSize {
	Size100 = 100,
	Size640 = 640,
}

export function getOciqGroupAvatar(group = '', size: QgroupAvatarSize | number = QgroupAvatarSize.Size100) {
	return `https://p.qlogo.cn/gh/${group}/${group}/${size}/`
}

interface FaviconOptions {
	provider?: 'google' | 'duckduckgo' | 'microlink'
	size?: number
}

// https://github.com/microlinkhq/unavatar
// https://docs.webp.se/public-services/unavatar/
export function getFavicon(domain: string, options?: FaviconOptions) {
	const { provider = 'google', size = 32 } = options || {}
	return `https://unavatar.webp.se/${provider}/${domain}?w=${size}`
}
