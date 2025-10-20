# Plugin Dependency Graph (2025-10-20)

- Total modules analysed: 81
- Total internal dependency edges: 131
- Leaf modules (no internal deps): 33

## How to Reproduce This Report

1. From the repository root run the dependency scan:
   ```bash
   cd packages/plugin
   npx madge --extensions ts,tsx --json src > ../../docs/dependency-analysis/madge-2025-10-20.json
   ```
   Adjust the output path or timestamp suffix as needed.
2. Generate the layered summary markdown (from repo root) using the Node helper snippet:
   ```bash
   node <<'NODE'
   const fs = require('fs');
   const path = require('path');
   const madgePath = path.join('docs','dependency-analysis','madge-2025-10-20.json');
   const raw = fs.readFileSync(madgePath,'utf8');
   const data = JSON.parse(raw);
   const modules = Object.keys(data).filter((k)=>!k.startsWith('../'));
   const moduleDeps = new Map();
   const externalCounts = new Map();
   let edgeCount = 0;
   for (const mod of modules) {
     const deps = data[mod] || [];
     const internal = deps.filter((dep)=>!dep.startsWith('../'));
     const external = deps.length - internal.length;
     moduleDeps.set(mod, new Set(internal));
     externalCounts.set(mod, external);
     edgeCount += internal.length;
   }
   const remaining = new Map();
   for (const [mod, deps] of moduleDeps.entries()) remaining.set(mod, new Set(deps));
   const layers = [];
   while (remaining.size > 0) {
     const bottoms = [];
     for (const [mod, deps] of remaining.entries()) if (deps.size === 0) bottoms.push(mod);
     if (bottoms.length === 0) {
       layers.push({ name: 'Cycle layer', modules: Array.from(remaining.keys()).sort(), note: 'Cycle detected: dependencies remain among these modules.' });
       break;
     }
     bottoms.sort();
     layers.push({ name: `Layer ${layers.length + 1}`, modules: bottoms });
     for (const mod of bottoms) remaining.delete(mod);
     for (const deps of remaining.values()) for (const b of bottoms) deps.delete(b);
   }
   const stats = modules.map((mod)=>({
     module: mod,
     internal: moduleDeps.get(mod)?.size ?? 0,
     external: externalCounts.get(mod) ?? 0,
   })).sort((a,b)=>a.internal - b.internal || a.module.localeCompare(b.module));
   const markdown = [];
   markdown.push('# Plugin Dependency Graph (2025-10-20)');
   markdown.push('');
   markdown.push(`- Total modules analysed: ${modules.length}`);
   markdown.push(`- Total internal dependency edges: ${stats.reduce((sum, s)=>sum + s.internal, 0)}`);
   markdown.push(`- Leaf modules (no internal deps): ${stats.filter((s)=>s.internal === 0).length}`);
   markdown.push('');
   markdown.push('## Layered Dependency Order');
   markdown.push('');
   for (const layer of layers) markdown.push(`- **${layer.name}**: ${layer.modules.join(', ')}${layer.note ? ` _( ${layer.note} )_` : ''}`);
   markdown.push('');
   markdown.push('## Modules by Internal Dependency Count');
   markdown.push('');
   markdown.push('| Module | Internal deps | External deps |');
   markdown.push('| --- | ---: | ---: |');
   for (const stat of stats) markdown.push(`| ${stat.module} | ${stat.internal} | ${stat.external} |`);
   const outPath = path.join('docs','dependency-analysis','2025-10-20-plugin-dependency-layers.md');
   fs.writeFileSync(outPath, markdown.join('\\n'));
   NODE
   ```
   Update the input/output filenames if you capture a new timestamped snapshot.

## Layered Dependency Order

- **Layer 1**: bridge/ReactBridge.ts, commands/export.ts, commands/mcpCommands.ts, commands/replaceTag.ts, commands/select.ts, commands/tagCmd.ts, commands/tagUtils.ts, container/test-container.ts, container/tokens.ts, lang/locale/en.ts, lang/locale/zh-cn.ts, lang/locale/zh-tw.ts, mcp/adapters/ModalNotifier.ts, mcp/adapters/ObsidianLogger.ts, mcp/adapters/toolMapping.ts, mcp/displayMode.ts, mcp/documentSessionHandlers.ts, mcp/providerIntegration.ts, mcp/toolResponseParser.ts, mcp/toolResultFormatter.ts, mcp/utilitySectionFormatter.ts, modal.ts, modals/toolBrowserModal.ts, prompt/modal.ts, prompt/template.ts, services/ObsidianDocumentService.ts, services/ObsidianLoggingService.ts, services/ObsidianNotificationService.ts, services/ObsidianStatusService.ts, suggests/mcpToolSuggestHelpers.ts, types/css-modules.d.ts, types/style-mod.d.ts, utils/documentWriteLock.ts
- **Layer 2**: bridge/ReactStatusBarIndicator.tsx, bridge/createReactContainer.ts, commands/asstTag.ts, commands/di/asstTagDI.ts, commands/di/systemTagDI.ts, commands/di/userTagDI.ts, commands/newChatTag.ts, commands/systemTag.ts, commands/userTag.ts, container/__tests__/test-container.ts, lang/helper.ts, mcp/codeBlockProcessor.ts, mcp/providerToolIntegration.ts, prompt/command.ts, services/ObsidianMcpService.ts, services/__tests__/ObsidianLoggingService.test.ts, services/__tests__/ObsidianNotificationService.test.ts, services/__tests__/ObsidianStatusService.test.ts, suggests/mcpParameterSuggest.ts, suggests/mcpToolSuggest.ts
- **Layer 3**: bridge/index.ts, commands/di/index.ts, commands/index.ts, prompt/index.ts, statusBarManager.ts
- **Layer 4**: mcp/adapters/StatusBarReporter.ts, mcp/toolCallingCoordinator.ts
- **Layer 5**: mcp/adapters/ClaudeProviderAdapter.ts, mcp/adapters/OllamaProviderAdapter.ts, mcp/adapters/OpenAIProviderAdapter.ts, mcp/adapters/index.ts
- **Layer 6**: mcp/adapters/OpenAIAdapterFactory.ts
- **Layer 7**: mcp/providerAdapters.ts
- **Layer 8**: mcp/index.ts
- **Cycle layer**: adapters/reactSettingsAdapter.ts, container/__tests__/plugin-container.test.ts, container/plugin-container.ts, editor.ts, featureFlags.ts, main.ts, reactSettingsTab.tsx, services/ObsidianSettingsService.ts, services/__tests__/ObsidianSettingsService.test.ts, settingTab.ts, settings.ts, settings/MCPServerSettings.ts, statusBarReact.ts, suggest.ts _( Cycle detected: dependencies remain among these modules. )_

## Modules by Internal Dependency Count

| Module | Internal deps | External deps |
| --- | ---: | ---: |
| bridge/ReactBridge.ts | 0 | 0 |
| commands/export.ts | 0 | 1 |
| commands/mcpCommands.ts | 0 | 1 |
| commands/replaceTag.ts | 0 | 1 |
| commands/select.ts | 0 | 0 |
| commands/tagCmd.ts | 0 | 0 |
| commands/tagUtils.ts | 0 | 1 |
| container/test-container.ts | 0 | 0 |
| container/tokens.ts | 0 | 0 |
| lang/locale/en.ts | 0 | 0 |
| lang/locale/zh-cn.ts | 0 | 0 |
| lang/locale/zh-tw.ts | 0 | 0 |
| mcp/adapters/ModalNotifier.ts | 0 | 1 |
| mcp/adapters/ObsidianLogger.ts | 0 | 2 |
| mcp/adapters/toolMapping.ts | 0 | 1 |
| mcp/displayMode.ts | 0 | 1 |
| mcp/documentSessionHandlers.ts | 0 | 1 |
| mcp/providerIntegration.ts | 0 | 2 |
| mcp/toolResponseParser.ts | 0 | 1 |
| mcp/toolResultFormatter.ts | 0 | 1 |
| mcp/utilitySectionFormatter.ts | 0 | 0 |
| modal.ts | 0 | 0 |
| modals/toolBrowserModal.ts | 0 | 2 |
| prompt/modal.ts | 0 | 0 |
| prompt/template.ts | 0 | 1 |
| services/ObsidianDocumentService.ts | 0 | 0 |
| services/ObsidianLoggingService.ts | 0 | 0 |
| services/ObsidianNotificationService.ts | 0 | 0 |
| services/ObsidianStatusService.ts | 0 | 0 |
| suggests/mcpToolSuggestHelpers.ts | 0 | 2 |
| types/css-modules.d.ts | 0 | 0 |
| types/style-mod.d.ts | 0 | 0 |
| utils/documentWriteLock.ts | 0 | 0 |
| bridge/createReactContainer.ts | 1 | 0 |
| bridge/ReactStatusBarIndicator.tsx | 1 | 0 |
| commands/newChatTag.ts | 1 | 1 |
| container/__tests__/test-container.ts | 1 | 0 |
| featureFlags.ts | 1 | 0 |
| mcp/adapters/ClaudeProviderAdapter.ts | 1 | 1 |
| mcp/adapters/OllamaProviderAdapter.ts | 1 | 2 |
| mcp/adapters/OpenAIProviderAdapter.ts | 1 | 1 |
| mcp/adapters/StatusBarReporter.ts | 1 | 1 |
| mcp/codeBlockProcessor.ts | 1 | 2 |
| mcp/providerToolIntegration.ts | 1 | 1 |
| services/__tests__/ObsidianLoggingService.test.ts | 1 | 0 |
| services/__tests__/ObsidianNotificationService.test.ts | 1 | 0 |
| services/__tests__/ObsidianSettingsService.test.ts | 1 | 0 |
| services/__tests__/ObsidianStatusService.test.ts | 1 | 0 |
| services/ObsidianMcpService.ts | 1 | 0 |
| services/ObsidianSettingsService.ts | 1 | 0 |
| statusBarManager.ts | 1 | 0 |
| suggests/mcpParameterSuggest.ts | 1 | 2 |
| suggests/mcpToolSuggest.ts | 1 | 2 |
| adapters/reactSettingsAdapter.ts | 2 | 0 |
| bridge/index.ts | 2 | 0 |
| commands/asstTag.ts | 2 | 1 |
| commands/di/asstTagDI.ts | 2 | 0 |
| commands/di/systemTagDI.ts | 2 | 0 |
| commands/di/userTagDI.ts | 2 | 0 |
| commands/systemTag.ts | 2 | 1 |
| commands/userTag.ts | 2 | 1 |
| container/__tests__/plugin-container.test.ts | 2 | 0 |
| mcp/adapters/OpenAIAdapterFactory.ts | 2 | 2 |
| mcp/toolCallingCoordinator.ts | 2 | 2 |
| prompt/command.ts | 2 | 1 |
| prompt/index.ts | 2 | 0 |
| settings.ts | 2 | 1 |
| settings/MCPServerSettings.ts | 2 | 2 |
| commands/di/index.ts | 3 | 0 |
| lang/helper.ts | 3 | 1 |
| mcp/adapters/index.ts | 3 | 0 |
| reactSettingsTab.tsx | 3 | 2 |
| statusBarReact.ts | 4 | 1 |
| suggest.ts | 4 | 1 |
| editor.ts | 5 | 3 |
| mcp/providerAdapters.ts | 5 | 0 |
| container/plugin-container.ts | 7 | 0 |
| settingTab.ts | 7 | 0 |
| commands/index.ts | 8 | 0 |
| mcp/index.ts | 10 | 1 |
| main.ts | 19 | 2 |
