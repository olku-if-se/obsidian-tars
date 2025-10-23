// Mock Obsidian API for testing
export class PluginSettingTab {
	constructor(app, plugin) {
		this.app = app
		this.plugin = plugin
	}

	display() {}
	hide() {}
}

export const App = class {}
export const Plugin = class {}
export const MarkdownView = class {}
export const Notice = class {}
export const Setting = class {}
export const ButtonComponent = class {}
export const TextComponent = class {}
export const TextAreaComponent = class {}
export const ToggleComponent = class {}
export const DropdownComponent = class {}
export const SliderComponent = class {}
export const moment = class {}
export const EditorSuggest = class {}
export const EditorPosition = class {}
export const EditorRange = class {}
export const EditorSelection = class {}
export const EditorChange = class {}
export const EmbedCache = class {}
export const LinkCache = class {}
export const MetadataCache = class {}
export const TFile = class {}
export const TFolder = class {}
export const Vault = class {}
export const Workspace = class {}

// Mock utility functions
export const debounce = (fn, delay) => fn
export const Platform = {
	isDesktop: true,
	isMacOS: false,
	isWindows: false,
	isLinux: true
}
