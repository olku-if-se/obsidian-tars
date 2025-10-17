import clsx from 'clsx'
import { useCallback, useMemo } from 'react'
import { Button, CollapsibleSection, ConfigurationInput, Input, SettingRow, Toggle, ValidationMessage } from '~/atoms'
import { useDebouncedCallbackWithCleanup } from '../../hooks/useDebouncedCallback'
import { useFormatConversion } from '../../hooks/useFormatConversion'
import { t } from '../../locales/i18n'
import type { MCPServerConfig, MCPServerRuntimeState } from '../SectionMcpServers/MCPServersSection'
import styles from './MCPServerCard.module.css'

type AlertTone = 'success' | 'error' | 'info' | 'warning'

const DEFAULT_RUNTIME_STATE: MCPServerRuntimeState = { testLoading: false }

// Type aliases following React rules (bundled props for >5 props)
type MCPServerCardData = {
	server: MCPServerConfig
	runtimeState?: MCPServerRuntimeState
	nameError?: string | null
}

type MCPServerCardUI = {
	isOpen: boolean
}

type MCPServerCardEvents = {
	onToggle: (enabled: boolean) => void
	onUpdate: (updates: Partial<MCPServerConfig>) => void
	onTest: () => void
	onRemove: () => void
	onToggleOpen: (open: boolean) => void
	onNotify?: (tone: AlertTone, message: string) => void
}

export type MCPServerCardProps = MCPServerCardData & MCPServerCardUI & MCPServerCardEvents

export function MCPServerCard({
	server,
	runtimeState = DEFAULT_RUNTIME_STATE,
	nameError,
	isOpen,
	onToggle,
	onUpdate,
	onTest,
	onRemove,
	onToggleOpen,
	onNotify
}: MCPServerCardProps): JSX.Element {
	const debouncedOnUpdate = useDebouncedCallbackWithCleanup(onUpdate, 500)
	const { convertFormat } = useFormatConversion()

	const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
		onToggle(event.target.checked)
	}

	const handleServerNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		debouncedOnUpdate({ name: event.target.value })
	}

	const handleConfigChange = (configInput: string) => {
		debouncedOnUpdate({ configInput })
	}

	const handleFormatChange = (displayMode: 'url' | 'command' | 'json') => {
		onUpdate({ displayMode })
	}

	const handleValidationChange = (validationState: MCPServerConfig['validationState']) => {
		onUpdate({ validationState })
	}

	const notify = useCallback(
		(tone: AlertTone, message: string) => {
			onNotify?.(tone, message)
		},
		[onNotify]
	)

	const handleCopy = useCallback(
		async (value: string, successKey: 'mcpServerCard.copySuccess') => {
			if (!value) {
				return
			}

			try {
				if (navigator?.clipboard?.writeText) {
					await navigator.clipboard.writeText(value)
				} else if (typeof document !== 'undefined') {
					const textarea = document.createElement('textarea')
					textarea.value = value
					document.body.appendChild(textarea)
					textarea.select()
					document.execCommand('copy')
					document.body.removeChild(textarea)
				} else {
					throw new Error('Clipboard unavailable')
				}
				notify('success', t(successKey))
			} catch {
				notify('error', t('mcpServerCard.copyFailure'))
			}
		},
		[notify]
	)

	const validationState = server.validationState || {
		isValid: true,
		errors: [],
		warnings: [],
		formatCompatibility: {
			canShowAsUrl: true,
			canShowAsCommand: true,
			canShowAsJson: true
		}
	}
	const validationErrors = validationState.errors
	const validationWarnings = validationState.warnings

	const statusInfo = useMemo(() => deriveStatusInfo(server, runtimeState, nameError), [server, runtimeState, nameError])

	const previewCommand = useMemo(() => {
		if (server.displayMode !== 'url') {
			return null
		}
		const trimmed = server.configInput.trim()
		if (!trimmed) {
			return null
		}
		const conversion = convertFormat(trimmed, 'url', 'command')
		return conversion.value || null
	}, [server.displayMode, server.configInput, convertFormat])

	const aggregatedErrors = validationErrors.join('\n')
	const aggregatedWarnings = validationWarnings.join('\n')

	return (
		<CollapsibleSection
			title={
				<div className={styles.summaryHeader}>
					<span className={styles.summaryName}>{server.name || t('mcpServerCard.placeholderName')}</span>
					<span className={clsx(styles.statusBadge, styles[statusInfo.badgeTone])}>{statusInfo.badgeLabel}</span>
				</div>
			}
			open={isOpen}
			onToggle={onToggleOpen}
			className={clsx(styles.serverCard, styles[statusInfo.badgeTone])}
		>
			<SettingRow name={t('mcpServerCard.controls')} description=''>
				<div className={clsx(styles.controlsContainer, runtimeState.testLoading && styles.loading)}>
					<Toggle checked={server.enabled} onChange={handleToggle} disabled={runtimeState.testLoading} />
					<Button
						variant='default'
						size='sm'
						onClick={onTest}
						disabled={runtimeState.testLoading || !server.enabled || !validationState.isValid || !!nameError}
					>
						{runtimeState.testLoading ? t('mcpServerCard.testing') : t('mcpServerCard.test')}
					</Button>
					<Button variant='danger' size='sm' onClick={onRemove} disabled={runtimeState.testLoading}>
						{t('mcpServerCard.delete')}
					</Button>
				</div>
			</SettingRow>

			<SettingRow name={t('mcpServerCard.serverName')} description={t('mcpServerCard.serverNameDesc')}>
				<div className={styles.nameField}>
					<Input
						type='text'
						value={server.name}
						onChange={handleServerNameChange}
						placeholder='my-mcp-server'
						className={styles.serverNameInput}
						disabled={runtimeState.testLoading}
					/>
					{nameError && (
						<div className={styles.validationMessage}>
							<ValidationMessage message={nameError} type='error' size='sm' />
						</div>
					)}
				</div>
			</SettingRow>

			<SettingRow
				name={t('mcpServerCard.configuration')}
				description={t('mcpServerCard.configurationDesc')}
				vertical={true}
			>
				<ConfigurationInput
					value={server.configInput}
					format={server.displayMode}
					onChange={handleConfigChange}
					onFormatChange={handleFormatChange}
					onValidationChange={handleValidationChange}
					disabled={runtimeState.testLoading || !server.enabled}
					showFormatToggle={true}
					resizable={true}
				/>

				{server.displayMode === 'url' && previewCommand && (
					<div className={styles.previewContainer}>
						<div className={styles.previewLabel}>{t('mcpServerCard.previewCommandLabel')}</div>
						<code className={styles.previewValue}>{previewCommand}</code>
						<Button variant='default' size='sm' onClick={() => handleCopy(previewCommand, 'mcpServerCard.copySuccess')}>
							{t('mcpServerCard.copyPreview')}
						</Button>
					</div>
				)}
			</SettingRow>

			<SettingRow name={t('mcpServerCard.status')} description='' vertical={true}>
				<div className={styles.statusContainer}>
					<div className={clsx(styles.statusMessage, styles[statusInfo.badgeTone])}>{statusInfo.text}</div>

					<div className={styles.statusDetail}>
						<span className={styles.statusLabel}>{t('mcpServerCard.statusFormatLabel')}</span>
						<span className={styles.statusValue}>{getFormatLabel(server.displayMode)}</span>
					</div>

					{typeof runtimeState.latency === 'number' && (
						<div className={styles.statusDetail}>
							<span className={styles.statusLabel}>{t('mcpServerCard.statusLatencyLabel')}</span>
							<span className={styles.statusValue}>{formatLatency(runtimeState.latency)}</span>
						</div>
					)}

					{server.failureCount > 0 && (
						<div className={styles.statusDetail}>
							<span className={styles.statusLabel}>{t('mcpServerCard.statusFailureCountLabel')}</span>
							<span className={styles.statusValue}>{server.failureCount}</span>
						</div>
					)}

					{nameError && (
						<div className={styles.statusDetail}>
							<span className={styles.statusLabel}>{t('mcpServerCard.statusNameLabel')}</span>
							<span className={styles.statusValue}>{nameError}</span>
						</div>
					)}

					{validationErrors.length > 0 && (
						<div className={styles.validationSection}>
							<div className={styles.validationHeader}>
								<span>{t('mcpServerCard.validationErrorsLabel')}</span>
								<Button
									variant='default'
									size='sm'
									onClick={() => handleCopy(aggregatedErrors, 'mcpServerCard.copySuccess')}
								>
									{t('mcpServerCard.copyErrors')}
								</Button>
							</div>
							<div className={styles.validationList}>
								{validationErrors.map((error) => (
									<div key={`error-${hashMessage(error)}`} className={styles.errorMessage}>
										{error}
									</div>
								))}
							</div>
						</div>
					)}

					{validationWarnings.length > 0 && (
						<div className={styles.validationSection}>
							<div className={styles.validationHeader}>
								<span>{t('mcpServerCard.validationWarningsLabel')}</span>
								<Button
									variant='default'
									size='sm'
									onClick={() => handleCopy(aggregatedWarnings, 'mcpServerCard.copySuccess')}
								>
									{t('mcpServerCard.copyWarnings')}
								</Button>
							</div>
							<div className={styles.validationList}>
								{validationWarnings.map((warning) => (
									<div key={`warning-${hashMessage(warning)}`} className={styles.warningMessage}>
										{warning}
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</SettingRow>
		</CollapsibleSection>
	)
}

function hashMessage(message: string): string {
	return Math.abs(
		Array.from(message).reduce((hash, char) => {
			return (hash << 5) - hash + char.charCodeAt(0)
		}, 0)
	)
		.toString(16)
		.padStart(6, '0')
}

function formatLatency(latency: number): string {
	return `${Math.round(latency)} ms`
}

function getFormatLabel(format: 'url' | 'command' | 'json'): string {
	switch (format) {
		case 'url':
			return t('mcpServerCard.formatUrl')
		case 'command':
			return t('mcpServerCard.formatCommand')
		case 'json':
			return t('mcpServerCard.formatJson')
	}
}

type StatusInfo = {
	text: string
	badgeLabel: string
	badgeTone: 'success' | 'error' | 'warning' | 'info'
}

function deriveStatusInfo(
	server: MCPServerConfig,
	runtime: MCPServerRuntimeState,
	nameError?: string | null
): StatusInfo {
	if (nameError) {
		return {
			text: nameError,
			badgeLabel: t('mcpServerCard.badgeInvalid'),
			badgeTone: 'error'
		}
	}

	if (server.autoDisabled) {
		return {
			text: t('mcpServerCard.serverAutoDisabled'),
			badgeLabel: t('mcpServerCard.badgeAutoDisabled'),
			badgeTone: 'error'
		}
	}

	if (!server.enabled) {
		return {
			text: t('mcpServerCard.serverDisabled'),
			badgeLabel: t('mcpServerCard.badgeDisabled'),
			badgeTone: 'warning'
		}
	}

	if (!server.validationState.isValid) {
		return {
			text: t('mcpServerCard.invalidConfig'),
			badgeLabel: t('mcpServerCard.badgeInvalid'),
			badgeTone: 'error'
		}
	}

	if (runtime.testLoading) {
		return {
			text: t('mcpServerCard.testing'),
			badgeLabel: t('mcpServerCard.badgeTesting'),
			badgeTone: 'info'
		}
	}

	if (runtime.statusMessage) {
		if (runtime.statusTone === 'success') {
			return {
				text: runtime.statusMessage,
				badgeLabel: t('mcpServerCard.badgeHealthy'),
				badgeTone: 'success'
			}
		}

		const tone: 'info' | 'warning' | 'error' = runtime.statusTone ?? 'info'
		const badgeLabel =
			tone === 'error'
				? t('mcpServerCard.badgeAttention')
				: tone === 'warning'
					? t('mcpServerCard.badgeAttention')
					: t('mcpServerCard.badgeReady')
		return {
			text: runtime.statusMessage,
			badgeLabel,
			badgeTone: tone
		}
	}

	return {
		text: t('mcpServerCard.ready'),
		badgeLabel: t('mcpServerCard.badgeReady'),
		badgeTone: 'success'
	}
}
