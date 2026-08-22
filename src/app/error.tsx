'use client'

import ZError from '../components/partial/ZError'

export default function ErrorPage({ error }: { error: Error & { digest?: string } }) {
	return (
		<ZError
			icon="line-md:close-circle-twotone"
			title="程序出错了"
			text={error.message || '发生了一个意外错误。'}
		/>
	)
}
