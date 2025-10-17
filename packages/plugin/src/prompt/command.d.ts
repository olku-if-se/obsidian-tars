import { type App, type Command } from 'obsidian';
import { type PluginSettings } from 'src/settings';
import { type PromptTemplate } from './template';
export declare const templateToCmdId: (template: PromptTemplate) => string;
export declare const getTitleFromCmdId: (id: string) => string;
export declare const loadTemplateFileCommand: (app: App, settings: PluginSettings, saveSettings: () => Promise<void>, buildPromptCommands: () => void) => Command;
export declare const promptTemplateCmd: (id: string, name: string, app: App, settings: PluginSettings) => Command;
//# sourceMappingURL=command.d.ts.map