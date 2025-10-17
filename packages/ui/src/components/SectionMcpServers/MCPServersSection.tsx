import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, CollapsibleSection, Input, SettingRow, Toggle } from '~/atoms'
import { t } from '../../locales/i18n'
import type { ValidationResult } from '../../utils/validation.v2'
import { MCPServerCard } from '../CardMcpServer'
import styles from './MCPServersSection.module.css'

export type MCPServerConfig = {
	id: string
	name: string
	enabled: boolean
	configInput: string
	displayMode: 'url' | 'command' | 'json'
	validationState: ValidationResult
	failureCount: number
	autoDisabled: boolean
	deploymentType: 'managed' | 'external'
	transport: 'stdio' | 'sse'
	dockerConfig?: {
		image: string
		name?: string
		ports?: string[]
		env?: Record<string, string>
	}
	sseConfig?: {
		url: string
	}
	retryPolicy?: {
		maxRetries: number
		backoffMs: number
	}
	timeout?: number
}

type MCPServersSectionData = {
	servers: MCPServerConfig[]
	globalLimits: {
		concurrentExecutions: number
		sessionLimitPerDocument: number
		defaultTimeout: number
		parallelExecutionEnabled: boolean
		llmUtilityEnabled: boolean
		maxParallelTools: number
	}
}

type MCPServersSectionUI = {
	expanded?: boolean
}

type MCPServersSectionEvents = {
	onAddServer: (template?: Partial<MCPServerConfig>) => void
	onRemoveServer: (id: string) => void
	onUpdateServer: (id: string, updates: Partial<MCPServerConfig>) => void
	onToggleServer: (id: string, enabled: boolean) => void
	onTestConnection: (id: string) => Promise<{ success: boolean; message: string; latency?: number }>
	onToggleSection: (open: boolean) => void
	onUpdateGlobalLimits: (limits: Partial<MCPServersSectionData['globalLimits']>) => void
}

type MCPServersSectionProps = MCPServersSectionData & MCPServersSectionUI & MCPServersSectionEvents

export type MCPServerRuntimeState = {
	testLoading: boolean
	statusMessage?: string
	statusTone?: ToastTone
	latency?: number
	lastTestedAt?: number
}

type ToastTone = 'success' | 'error' | 'info' | 'warning'

type Toast = {
	id: string
	message: string
	tone: ToastTone
}

type QuickAddOption = {
	id: 'exa' | 'filesystem'
	buttonLabelKey: string
	toastMessageKey: string
	toastTone?: ToastTone
	template: Partial<MCPServerConfig>
}

const TOAST_TIMEOUT_MS = 4500

const DEFAULT_RUNTIME_STATE: MCPServerRuntimeState = { testLoading: false }

export function MCPServersSection({
	servers = [],
	globalLimits = {
		concurrentExecutions: 3,
		sessionLimitPerDocument: 25,
		defaultTimeout: 30000,
		parallelExecutionEnabled: false,
		llmUtilityEnabled: true,
		maxParallelTools: 3
	},
	expanded = false,
	onAddServer,
	onRemoveServer,
	onUpdateServer,
	onToggleServer,
	onTestConnection,
	onToggleSection,
	onUpdateGlobalLimits
}: MCPServersSectionProps): JSX.Element {
	const [runtimeState, setRuntimeState] = useState<Record<string, MCPServerRuntimeState>>({})
	const [expandedServers, setExpandedServers] = useState<Record<string, boolean>>({})
	const [toasts, setToasts] = useState<Toast[]>([])
	const toastTimersRef = useRef<Record<string, number>>({})

	const quickAddOptions = useMemo(createQuickAddOptions, [])

	// Track name validation issues (duplicate or invalid names)
	const nameErrors = useMemo(() => {
		const counts = servers.reduce<Record<string, number>>((acc, server) => {
			const key = server.name.trim().toLowerCase()
			if (key) {
				acc[key] = (acc[key] ?? 0) + 1
			}
			return acc
		}, {})

		return servers.reduce<Map<string, string>>((acc, server) => {
			const trimmed = server.name.trim()
			if (!trimmed) {
				acc.set(server.id, t('mcpServerCard.nameErrorRequired'))
				return acc
			}
			if (trimmed.length > 50) {
				acc.set(server.id, t('mcpServerCard.nameErrorLength'))
				return acc
			}
			if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
				acc.set(server.id, t('mcpServerCard.nameErrorCharacters'))
				return acc
			}
			if (counts[trimmed.toLowerCase()] > 1) {
				acc.set(server.id, t('mcpServerCard.nameErrorDuplicate'))
			}
			return acc
		}, new Map<string, string>())
	}, [servers])

	// Ensure runtime state exists for all servers and prune removed servers
	useEffect(() => {
		setRuntimeState((prev) => {
			const next: Record<string, MCPServerRuntimeState> = {}
			let changed = false
			const ids = new Set(servers.map((server) => server.id))

			for (const server of servers) {
				if (prev[server.id]) {
					next[server.id] = prev[server.id]
				} else {
					next[server.id] = { ...DEFAULT_RUNTIME_STATE }
					changed = true
				}
			}

			for (const id of Object.keys(prev)) {
				if (!ids.has(id)) {
					changed = true
					break
				}
			}

			return changed ? next : prev
		})
	}, [servers])

	// Auto-expand newly created servers and remove stale expanded state entries
	useEffect(() => {
		setExpandedServers((prev) => {
			const next: Record<string, boolean> = { ...prev }
			let changed = false
			const ids = new Set(servers.map((server) => server.id))

			for (const server of servers) {
				if (!(server.id in next)) {
					next[server.id] = true
					changed = true
				}
			}

			for (const id of Object.keys(next)) {
				if (!ids.has(id)) {
					delete next[id]
					changed = true
				}
			}

			return changed ? next : prev
		})
	}, [servers])

	// Cleanup toast timers on unmount
	useEffect(() => {
		return () => {
			if (typeof window !== 'undefined') {
				Object.values(toastTimersRef.current).forEach((timerId) => {
					window.clearTimeout(timerId)
				})
			}
		}
	}, [])

	const addToast = useCallback((tone: ToastTone, message: string) => {
		const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
		setToasts((prev) => [...prev, { id, message, tone }])

		if (typeof window !== 'undefined') {
			const timeoutId = window.setTimeout(() => {
				setToasts((prev) => prev.filter((toast) => toast.id !== id))
				window.clearTimeout(timeoutId)
				delete toastTimersRef.current[id]
			}, TOAST_TIMEOUT_MS)
			toastTimersRef.current[id] = timeoutId
		}
	}, [])

	const dismissToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id))
		if (typeof window !== 'undefined') {
			const timer = toastTimersRef.current[id]
			if (timer) {
				window.clearTimeout(timer)
				delete toastTimersRef.current[id]
			}
		}
	}, [])

	const handleTestConnection = useCallback(
		async (serverId: string) => {
			setRuntimeState((prev) => {
				const current = prev[serverId] ?? { ...DEFAULT_RUNTIME_STATE }
				return {
					...prev,
					[serverId]: {
						...current,
						testLoading: true
					}
				}
			})

			try {
				const result = await onTestConnection(serverId)
				setRuntimeState((prev) => {
					const current = prev[serverId] ?? { ...DEFAULT_RUNTIME_STATE }
					return {
						...prev,
						[serverId]: {
							...current,
							testLoading: false,
							statusMessage: result.message,
							statusTone: result.success ? 'success' : 'error',
							latency: result.latency,
							lastTestedAt: Date.now()
						}
					}
				})

				addToast(result.success ? 'success' : 'error', result.message)
			} catch (error) {
				const fallback = error instanceof Error ? error.message : t('mcpServersSection.testError')
				setRuntimeState((prev) => {
					const current = prev[serverId] ?? { ...DEFAULT_RUNTIME_STATE }
					return {
						...prev,
						[serverId]: {
							...current,
							testLoading: false,
							statusMessage: fallback,
							statusTone: 'error'
						}
					}
				})
				addToast('error', fallback)
			}
		},
		[onTestConnection, addToast]
	)

	const handleUpdateServer = useCallback(
		(id: string, updates: Partial<MCPServerConfig>) => {
			const nextUpdates = { ...updates }
			if (updates.name !== undefined) {
				nextUpdates.name = updates.name.trim()
			}
			onUpdateServer(id, nextUpdates)
		},
		[onUpdateServer]
	)

	const handleRemoveServer = useCallback(
		(server: MCPServerConfig) => {
			onRemoveServer(server.id)
			addToast('info', t('mcpServersSection.toastServerRemoved', { name: server.name }))
		},
		[onRemoveServer, addToast]
	)

	const handleToggleServer = useCallback(
		(server: MCPServerConfig, enabled: boolean) => {
			onToggleServer(server.id, enabled)
			const tone: ToastTone = enabled ? 'success' : 'warning'
			const message = enabled
				? t('mcpServersSection.toastServerEnabled', { name: server.name })
				: t('mcpServersSection.toastServerDisabled', { name: server.name })
			addToast(tone, message)
		},
		[onToggleServer, addToast]
	)

	const handleQuickAdd = useCallback(
		(option: QuickAddOption) => {
			onAddServer(option.template)
			addToast(option.toastTone ?? 'info', option.toastMessageKey as any)
		},
		[onAddServer, addToast]
	)

	const handleAddCustomServer = useCallback(() => {
		onAddServer()
		addToast('info', t('mcpServersSection.toastBlankServerAdded'))
	}, [onAddServer, addToast])

	const handleToggleCard = useCallback((serverId: string, open: boolean) => {
		setExpandedServers((prev) => {
			if (prev[serverId] === open) {
				return prev
			}
			return { ...prev, [serverId]: open }
		})
	}, [])

	const notifyFromCard = useCallback(
		(tone: ToastTone, message: string) => {
			addToast(tone, message)
		},
		[addToast]
	)

	return (
		<CollapsibleSection title={t('mcpServersSection.title')} open={expanded} onToggle={onToggleSection}>
			{toasts.length > 0 && (
				<div className={styles.toastContainer} role='status' aria-live='polite'>
					{toasts.map((toast) => (
						<div key={toast.id} className={clsx(styles.toast, styles[toast.tone])}>
							<span>{toast.message}</span>
							<button
								type='button'
								className={styles.toastDismiss}
								onClick={() => dismissToast(toast.id)}
								aria-label={t('mcpServersSection.toastDismiss')}
							>
								×
							</button>
						</div>
					))}
				</div>
			)}

			<div className={styles.globalSettings}>
				<h3 className={styles.sectionHeading}>{t('mcpServersSection.globalSettings')}</h3>

				<SettingRow
					name={t('mcpServersSection.concurrentExecutions')}
					description={t('mcpServersSection.concurrentExecutionsDesc')}
				>
					<Input
						type='number'
						value={globalLimits.concurrentExecutions}
						onChange={(e) => {
							const parsed = Number.parseInt(e.target.value, 10)
							if (Number.isNaN(parsed)) {
								onUpdateGlobalLimits({ concurrentExecutions: 1 })
								return
							}
							const clamped = clamp(parsed, 1, 10)
							onUpdateGlobalLimits({ concurrentExecutions: clamped })
						}}
						min='1'
						max='10'
					/>
				</SettingRow>

				<SettingRow name={t('mcpServersSection.sessionLimit')} description={t('mcpServersSection.sessionLimitDesc')}>
					<Input
						type='number'
						value={globalLimits.sessionLimitPerDocument}
						onChange={(e) => {
							const parsed = Number.parseInt(e.target.value, 10)
							if (Number.isNaN(parsed)) {
								onUpdateGlobalLimits({ sessionLimitPerDocument: -1 })
								return
							}
							const clamped = parsed < -1 ? -1 : clamp(parsed, -1, 100)
							onUpdateGlobalLimits({ sessionLimitPerDocument: clamped })
						}}
						min='-1'
						max='100'
					/>
				</SettingRow>

				<SettingRow
					name={t('mcpServersSection.defaultTimeout')}
					description={t('mcpServersSection.defaultTimeoutDesc')}
				>
					<Input
						type='number'
						value={globalLimits.defaultTimeout}
						onChange={(e) => {
							const parsed = Number.parseInt(e.target.value, 10)
							if (Number.isNaN(parsed)) {
								onUpdateGlobalLimits({ defaultTimeout: 30000 })
								return
							}
							const clamped = clamp(parsed, 1000, 300000)
							onUpdateGlobalLimits({ defaultTimeout: clamped })
						}}
						min='1000'
						max='300000'
					/>
				</SettingRow>

				<SettingRow
					name={t('mcpServersSection.parallelExecution')}
					description={t('mcpServersSection.parallelExecutionDesc')}
				>
					<Toggle
						checked={globalLimits.parallelExecutionEnabled}
						onChange={(e) => onUpdateGlobalLimits({ parallelExecutionEnabled: e.target.checked })}
					/>
				</SettingRow>

				<SettingRow name={t('mcpServersSection.llmUtility')} description={t('mcpServersSection.llmUtilityDesc')}>
					<Toggle
						checked={globalLimits.llmUtilityEnabled}
						onChange={(e) => onUpdateGlobalLimits({ llmUtilityEnabled: e.target.checked })}
					/>
				</SettingRow>

				<SettingRow
					name={t('mcpServersSection.maxParallelTools')}
					description={t('mcpServersSection.maxParallelToolsDesc')}
				>
					<Input
						type='number'
						value={globalLimits.maxParallelTools}
						onChange={(e) => {
							const parsed = Number.parseInt(e.target.value, 10)
							if (Number.isNaN(parsed)) {
								onUpdateGlobalLimits({ maxParallelTools: 1 })
								return
							}
							const clamped = clamp(parsed, 1, 5)
							onUpdateGlobalLimits({ maxParallelTools: clamped })
						}}
						min='1'
						max='5'
						disabled={!globalLimits.parallelExecutionEnabled}
					/>
				</SettingRow>
			</div>

			<div className={styles.serverListContainer}>
				{servers.length === 0 ? (
					<div className={styles.noServers}>{t('mcpServersSection.noServers')}</div>
				) : (
					<div className={styles.serverList}>
						{servers.map((server) => (
							<MCPServerCard
								key={server.id}
								server={server}
								runtimeState={runtimeState[server.id] ?? DEFAULT_RUNTIME_STATE}
								isOpen={expandedServers[server.id] ?? false}
								nameError={nameErrors.get(server.id) ?? null}
								onToggle={(enabled) => handleToggleServer(server, enabled)}
								onUpdate={(updates) => handleUpdateServer(server.id, updates)}
								onTest={() => handleTestConnection(server.id)}
								onRemove={() => handleRemoveServer(server)}
								onToggleOpen={(open) => handleToggleCard(server.id, open)}
								onNotify={notifyFromCard}
							/>
						))}
					</div>
				)}
			</div>

			<SettingRow
				name={t('mcpServersSection.quickAdd.title')}
				description={t('mcpServersSection.quickAdd.description')}
				layoutRatio={[1, 1]}
			>
				<div className={styles.quickAddButtons}>
					{quickAddOptions.map((option) => (
						<Button key={option.id} onClick={() => handleQuickAdd(option)}>
							{t(option.buttonLabelKey as any)}
						</Button>
					))}
				</div>
			</SettingRow>

			<SettingRow
				name={t('mcpServersSection.addCustom.title')}
				description={t('mcpServersSection.addCustom.description')}
				layoutRatio={[2, 1]}
			>
				<Button onClick={handleAddCustomServer}>{t('mcpServersSection.addCustom.cta')}</Button>
			</SettingRow>
		</CollapsibleSection>
	)
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max)
}

function createQuickAddOptions(): QuickAddOption[] {
	const exaConfig = JSON.stringify(
		{
			mcpServers: {
				exa: {
					command: 'npx',
					args: ['-y', 'exa-mcp-server'],
					env: {
						EXA_API_KEY: '{env:EXA_API_KEY}'
					}
				}
			}
		},
		null,
		2
	)

	return [
		{
			id: 'exa',
			buttonLabelKey: 'mcpServersSection.quickAdd.exa.button',
			toastMessageKey: 'mcpServersSection.quickAdd.exa.toast',
			toastTone: 'info',
			template: {
				name: 'exa',
				displayMode: 'command',
				configInput: exaConfig,
				enabled: false,
				failureCount: 0,
				autoDisabled: false
			}
		},
		{
			id: 'filesystem',
			buttonLabelKey: 'mcpServersSection.quickAdd.filesystem.button',
			toastMessageKey: 'mcpServersSection.quickAdd.filesystem.toast',
			toastTone: 'info',
			template: {
				name: 'filesystem',
				displayMode: 'command',
				configInput: 'npx -y @modelcontextprotocol/server-filesystem /path/to/files',
				enabled: false,
				failureCount: 0,
				autoDisabled: false
			}
		}
	]
}
