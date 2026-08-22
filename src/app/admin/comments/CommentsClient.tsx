'use client'

import { Icon } from '@iconify/react'
import { Button, EmptyState, useToast } from '@/components/admin/AdminControls'

export default function CommentsClient() {
	const toast = useToast()
	return (
<><header className="admin-page-heading"><div><h1>评论</h1><p>通过服务器端 Artalk Adapter 管理评论，凭据不会发送到浏览器。</p></div><Button type="button" onClick={() => toast.show('正在通过安全 Adapter 同步评论…')}><Icon icon="tabler:refresh" />同步评论</Button></header>
		<EmptyState title="暂无待处理评论" description="评论会按固定 commentKey 映射到文章，即使变更展示路径也不会丢失关联。" action={<Button type="button" variant="ghost" onClick={() => toast.show('配置 Artalk 服务地址后即可开始同步')}>配置 Adapter</Button>} />
		<p className="admin-swipe-hint"><Icon icon="tabler:arrows-left-right" />移动端评论卡片支持左滑，显示隐藏或删除操作。</p>
</>
)
}
