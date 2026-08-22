import React, { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import { useToast } from '../components/Toast'

interface LogEntry {
	type: 'start' | 'stdout' | 'stderr' | 'done' | 'error'
	message: string
	time: string
}

export const ConsoleView: React.FC = () => {
	const { showToast } = useToast()
	const [logs, setLogs] = useState<LogEntry[]>([])
	const [building, setBuilding] = useState(false)
	const [buildStats, setBuildStats] = useState<{ lastBuildTime?: string, durationSeconds?: number, totalRuns: number }>({
		totalRuns: 0,
	})
	const terminalEndRef = useRef<HTMLDivElement | null>(null)

	// MDX 快速调试检验状态
	const [testMdxInput, setTestMdxInput] = useState('')
	const [testMdxResult, setTestMdxResult] = useState<{ valid?: boolean, error?: string, line?: number } | null>(null)
	const [testingMdx, setTestingMdx] = useState(false)

	// Commit 格式化助手状态
	const [commitType, setCommitType] = useState('feat')
	const [commitScope, setCommitScope] = useState('post')
	const [commitSubject, setCommitSubject] = useState('')
	const [commitBg, setCommitBg] = useState('')
	const [commitIssue, setCommitIssue] = useState('')
	const [commitSolution, setCommitSolution] = useState('')

	const scrollToBottom = () => {
		terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	useEffect(() => {
		scrollToBottom()
	}, [logs])

	const handleStartBuild = () => {
		if (building) return
		const startMs = Date.now()
		setBuilding(true)
		setLogs(prev => [
			...prev,
			{
				type: 'start',
				message: `--- 启动全量静态数据与 MDX 编译任务 [${new Date().toLocaleTimeString()}] ---`,
				time: new Date().toLocaleTimeString(),
			},
		])

		const es = adminApi.createBuildEventSource()

		es.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data)
				setLogs(prev => [
					...prev,
					{
						type: data.type,
						message: data.message,
						time: new Date().toLocaleTimeString(),
					},
				])

				if (data.type === 'done' || data.type === 'error') {
					setBuilding(false)
					es.close()
					const duration = Number(((Date.now() - startMs) / 1000).toFixed(2))
					setBuildStats(prev => ({
						lastBuildTime: new Date().toLocaleTimeString(),
						durationSeconds: duration,
						totalRuns: prev.totalRuns + 1,
					}))
					if (data.type === 'done') {
						showToast(`全量构建完成，耗时 ${duration}s`, 'success')
					}
					else {
						showToast('构建出现异常，请查看日志', 'error')
					}
				}
			}
			catch (e) {
				console.error('解析构建日志错误', e)
			}
		}

		es.onerror = () => {
			setLogs(prev => [
				...prev,
				{
					type: 'error',
					message: '连接已结束或构建完成',
					time: new Date().toLocaleTimeString(),
				},
			])
			setBuilding(false)
			es.close()
		}
	}

	const handleClearLogs = () => {
		setLogs([])
	}

	const handleTestMdx = async () => {
		if (!testMdxInput.trim()) {
			showToast('请输入待校验的 MDX 片段', 'warning')
			return
		}
		setTestingMdx(true)
		setTestMdxResult(null)
		try {
			const res = await adminApi.validatePostMdx(testMdxInput)
			setTestMdxResult(res)
			if (res.valid) {
				showToast('MDX 语法解析通过，无语法错误', 'success')
			}
			else {
				showToast(`语法错误: ${res.error}`, 'error')
			}
		}
		catch (err: any) {
			showToast(`校验请求失败: ${err.message}`, 'error')
		}
		finally {
			setTestingMdx(false)
		}
	}

	const fullCommitMessage = `${commitType}(${commitScope}): ${commitSubject}

[背景]
${commitBg || '日常博文写作与站点数据更新'}

[问题]
${commitIssue || '无'}

[方案]
${commitSolution || '新增博文并同步静态索引数据'}

[影响]
更新 content/posts 及静态索引

[风险]
无`

	const handleCopyCommit = () => {
		navigator.clipboard.writeText(fullCommitMessage)
		showToast('已复制规范 Commit 模板到剪贴板', 'success')
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
			{/* 顶部构建控制卡片 */}
			<div className="admin-card" style={{ padding: '14px 18px' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
					<div>
						<div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text-1)' }}>
							运维与全量静态构建控制台
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2 }}>
							触发 <code>scripts/build-static.ts</code> 预编译 MDX、提取 Frontmatter 并刷新全站索引
						</div>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						{buildStats.lastBuildTime && (
							<span style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
								最近构建: {buildStats.lastBuildTime} ({buildStats.durationSeconds}s)
							</span>
						)}

						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={handleClearLogs}
							disabled={logs.length === 0}
						>
							<Icon icon="tabler:eraser" />
							<span>清空</span>
						</button>

						<button
							type="button"
							className="admin-btn btn-primary btn-sm"
							onClick={handleStartBuild}
							disabled={building}
						>
							<Icon icon={building ? 'tabler:loader-2' : 'tabler:player-play'} />
							<span>{building ? '正在构建...' : '触发静态全量构建'}</span>
						</button>
					</div>
				</div>
			</div>

			{/* 终端日志区 */}
			<div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
				<div
					style={{
						padding: '8px 14px',
						background: '#161b22',
						borderBottom: '1px solid #30363d',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						fontSize: 11,
						color: '#8b949e',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
						<div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f56' }} />
						<div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e' }} />
						<div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27c93f' }} />
						<span style={{ marginLeft: 6, fontWeight: 500, fontFamily: 'var(--admin-font-mono)' }}>build-static stream</span>
					</div>
					<div>{building ? '执行中...' : '就绪'}</div>
				</div>

				<div
					className="admin-terminal"
					style={{
						height: 280,
						border: 'none',
						borderRadius: 0,
					}}
				>
					{logs.length === 0 ? (
						<div style={{ color: '#8b949e', padding: 20, textAlign: 'center' }}>
							点击右上角「触发静态全量构建」开始执行任务...
						</div>
					) : (
						logs.map((l, idx) => (
							<div key={idx} className={`log-line ${l.type}`}>
								<span style={{ color: '#8b949e', userSelect: 'none' }}>[{l.time}]</span>
								<span>{l.message}</span>
							</div>
						))
					)}
					<div ref={terminalEndRef} />
				</div>
			</div>

			{/* MDX 语法静态沙箱排错工具 */}
			<div className="admin-card" style={{ padding: '16px 18px' }}>
				<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--admin-text-1)' }}>
					MDX 语法即时沙箱校验
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
					<textarea
						className="admin-textarea"
						placeholder="在此粘贴任意 Markdown / MDX 片段，测试是否存在 JSX 语法报错或标签未闭合问题..."
						value={testMdxInput}
						onChange={e => setTestMdxInput(e.target.value)}
						style={{ height: 90, fontFamily: 'var(--admin-font-mono)', fontSize: 12 }}
					/>

					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<div>
							{testMdxResult && (
								<span className={`admin-badge ${testMdxResult.valid ? 'badge-success' : 'badge-danger'}`} style={{ padding: '4px 8px' }}>
									<Icon icon={testMdxResult.valid ? 'tabler:check' : 'tabler:alert-circle'} />
									<span>
										{testMdxResult.valid
											? '校验通过：MDX 语法解析无任何错误'
											: `语法报错 (第 ${testMdxResult.line || '?'} 行): ${testMdxResult.error}`}
									</span>
								</span>
							)}
						</div>

						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={handleTestMdx}
							disabled={testingMdx || !testMdxInput.trim()}
						>
							<Icon icon={testingMdx ? 'tabler:loader-2' : 'tabler:scan'} />
							<span>{testingMdx ? '正在校验...' : '执行校验'}</span>
						</button>
					</div>
				</div>
			</div>

			{/* Git 提交规范辅助生成工具 */}
			<div className="admin-card" style={{ padding: '16px 18px' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
					<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)' }}>
						工程规范 Commit Message 生成助手
					</div>
					<button
						type="button"
						className="admin-btn btn-secondary btn-sm"
						onClick={handleCopyCommit}
					>
						<Icon icon="tabler:copy" />
						<span>复制 Commit 文本</span>
					</button>
				</div>

				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
					<div>
						<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>Commit Type</label>
						<select
							className="admin-select"
							value={commitType}
							onChange={e => setCommitType(e.target.value)}
						>
							<option value="feat">feat (新功能/新博文)</option>
							<option value="fix">fix (修复问题)</option>
							<option value="refactor">refactor (重构)</option>
							<option value="perf">perf (性能优化)</option>
							<option value="docs">docs (文档)</option>
							<option value="chore">chore (构建/日常)</option>
						</select>
					</div>

					<div>
						<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>Scope (影响模块)</label>
						<input
							type="text"
							className="admin-input"
							placeholder="如 post, feed, config"
							value={commitScope}
							onChange={e => setCommitScope(e.target.value)}
						/>
					</div>

					<div style={{ gridColumn: '1 / -1' }}>
						<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>Subject (动词开头行为描述) *</label>
						<input
							type="text"
							className="admin-input"
							placeholder="如：新增《微服务架构实践》博文"
							value={commitSubject}
							onChange={e => setCommitSubject(e.target.value)}
						/>
					</div>

					<div>
						<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>[背景]</label>
						<input
							type="text"
							className="admin-input"
							placeholder="修改原因与背景"
							value={commitBg}
							onChange={e => setCommitBg(e.target.value)}
						/>
					</div>

					<div>
						<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>[问题]</label>
						<input
							type="text"
							className="admin-input"
							placeholder="存在的问题"
							value={commitIssue}
							onChange={e => setCommitIssue(e.target.value)}
						/>
					</div>

					<div>
						<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>[方案]</label>
						<input
							type="text"
							className="admin-input"
							placeholder="解决手段"
							value={commitSolution}
							onChange={e => setCommitSolution(e.target.value)}
						/>
					</div>
				</div>

				<div style={{ marginTop: 12 }}>
					<pre style={{ background: 'var(--admin-bg-subtle)', padding: 10, borderRadius: 6, fontSize: 11, border: '1px solid var(--admin-border)', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'var(--admin-font-mono)' }}>
						{fullCommitMessage}
					</pre>
				</div>
			</div>
		</div>
	)
}

export default ConsoleView
