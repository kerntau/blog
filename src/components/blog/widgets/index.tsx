import Toc from './Toc'
import BlogStats from '../../widget/BlogStats'
import BlogLog from '../../widget/BlogLog'
import BlogTech from '../../widget/BlogTech'
import CommGroup from '../../widget/CommGroup'
import Empty from '../../widget/Empty'

export const widgetMap: Record<string, React.ComponentType> = {
	'toc': Toc,
	'blog-stats': BlogStats,
	'blog-log': BlogLog,
	'blog-tech': BlogTech,
	'comm-group': CommGroup,
	'empty': Empty,
}
