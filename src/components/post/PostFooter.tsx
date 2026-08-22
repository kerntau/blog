import type { ArticleProps } from '../../types/article'
import appConfig from '../../app.config'
import ProseA from '../content/ProseA'
import styles from './PostFooter.module.scss'

export default function PostFooter(props: ArticleProps) {
	const { references, meta } = props

	return (
		<div className={styles.postFooter}>
			{references && references.length > 0 && (
				<section>
					<div className={`${styles.title} text-creative`}>
						参考链接
					</div>
					<div className={styles.content}>
						<ul>
							{references.map(({ title, link }, i) => (
								<li key={i}>
									{link ? (
										<ProseA href={link}>{title ?? link}</ProseA>
									) : (
										<span>{title ?? '未命名链接'}</span>
									)}
								</li>
							))}
						</ul>
					</div>
				</section>
			)}

			<section>
				<div className={`${styles.title} text-creative`}>
					{meta?.slots?.copyright?.props?.title as string || '许可协议'}
				</div>
				<div className={styles.content}>
					{/* 注意：此处假设 meta?.slots?.copyright 渲染逻辑在 MDX 处理 */}
					<p>
						本文采用 <ProseA href={appConfig.copyright.url}>
							{appConfig.copyright.name}
           </ProseA>
						许可协议，转载请注明出处。
					</p>
				</div>
			</section>
		</div>
	)
}
