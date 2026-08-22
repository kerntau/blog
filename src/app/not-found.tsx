import ZError from '../components/partial/ZError'

export default function NotFound() {
	return (
		<ZError
			icon="line-md:document-delete-twotone"
			title="404 - 页面未找到"
			text="您访问的页面可能已搬家或不复存在。"
		/>
	)
}
