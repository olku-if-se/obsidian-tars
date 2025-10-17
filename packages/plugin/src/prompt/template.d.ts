import type { App } from 'obsidian';
export interface PromptTemplate {
    readonly title: string;
    readonly template: string;
}
export declare const getPromptTemplatesFromFile: (app: App, promptFilePath: string) => Promise<{
    promptTemplates: PromptTemplate[];
    reporter: string[];
}>;
export declare const findChangedTemplates: (oldTemplates: PromptTemplate[], newTemplates: PromptTemplate[]) => PromptTemplate[];
//# sourceMappingURL=template.d.ts.map