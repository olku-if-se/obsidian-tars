// Main contracts exports

export * from './events'
export * from './providers'
export * from './services'

// Force export of all types to prevent tree-shaking
export type {
	// Providers types
	ToolExecutor,
	MCPServerManager,
	ToolCallingCoordinator,
	MCPToolInjector,
	ProviderAdapter,
	MCPIntegration,
	ToolSnapshot,
	Vendor,
	Capability,
	BaseOptions,
	Message,
	MsgRole,
	EmbedCache,
	SaveAttachment,
	ResolveEmbedAsBinary,
	CreatePlainText,
	NormalizePath,
	FrameworkConfig,
	Editor,
	StatusBarManager,
	NoticeSystem,
	RequestSystem,
	RequestUrlOptions,
	RequestUrlResponse,
	PlatformInfo,
	PluginSettings,
	DIBaseOptions,
	DIBaseProvider
} from './providers'

export type {
	ILoggingService,
	INotificationService,
	ISettingsService,
	IStatusService,
	IDocumentService,
	IMcpService,
	CodeBlockProcessor,
	McpStatus,
	DocumentWriteLock,
	StatusInfo,
	StatusState
} from './services'

export type {
	ProviderEvent,
	ProviderEvents,
	ProviderEventEmitter,
	ProviderRequestEvent,
	ProviderToolEvent
} from './events'
