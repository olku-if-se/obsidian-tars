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