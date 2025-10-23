#!/usr/bin/env node

import {
	isImageGenerationProvider,
	isToolCallingProvider,
	isVisionProvider,
} from "@tars/contracts/providers";
import { tokens } from "@tars/contracts/tokens";
import { createProviderContainer } from "./ProviderModule";

/**
 * Simple CLI demo to showcase LLM provider library usage
 */
async function runDemo(): Promise<void> {
	console.log("🚀 LLM Provider Library Demo\n");

	// Setup DI container
	const container = createProviderContainer();

	// Get all providers
	const allProviders = container.get(tokens.Providers);

	console.log(`📦 Registered ${allProviders.length} providers:\n`);

	// Group providers by capabilities for better display
	const capabilityGroups = {
		"Text Generation": allProviders.filter((p) =>
			p.capabilities.includes("Text Generation"),
		),
		"Tool Calling": allProviders.filter((p) =>
			p.capabilities.includes("Tool Calling"),
		),
		"Image Vision": allProviders.filter((p) =>
			p.capabilities.includes("Image Vision"),
		),
		"Image Generation": allProviders.filter((p) =>
			p.capabilities.includes("Image Generation"),
		),
	};

	Object.entries(capabilityGroups).forEach(([capability, providers]) => {
		if (providers.length > 0) {
			console.log(`🔧 ${capability} (${providers.length} providers):`);
			providers.forEach((provider) => {
				const extraCaps = provider.capabilities.filter((c) => c !== capability);
				const extraInfo =
					extraCaps.length > 0 ? ` [also: ${extraCaps.join(", ")}]` : "";
				console.log(`   ✨ ${provider.displayName}${extraInfo}`);
			});
			console.log("");
		}
	});

	// Show detailed provider information
	console.log("📋 Detailed Provider Information:\n");
	allProviders.forEach((provider) => {
		console.log(`✨ ${provider.displayName}`);
		console.log(`   ID: ${provider.name}`);
		console.log(`   Capabilities: ${provider.capabilities.join(", ")}`);

		// Show capability-specific features
		if (isToolCallingProvider(provider)) {
			console.log(`   🔧 Tool Calling: Supported`);
		}
		if (isImageGenerationProvider(provider)) {
			console.log(`   🎨 Image Generation: Supported`);
		}
		if (isVisionProvider(provider)) {
			console.log(`   👁️  Vision: Supported`);
		}

		console.log("");
	});

	// Summary statistics
	const stats = {
		total: allProviders.length,
		textGeneration: capabilityGroups["Text Generation"].length,
		toolCalling: capabilityGroups["Tool Calling"].length,
		vision: capabilityGroups["Image Vision"].length,
		imageGeneration: capabilityGroups["Image Generation"].length,
	};

	console.log("📊 Summary Statistics:");
	console.log(`   Total Providers: ${stats.total}`);
	console.log(`   Text Generation: ${stats.textGeneration}`);
	console.log(`   Tool Calling: ${stats.toolCalling}`);
	console.log(`   Image Vision: ${stats.vision}`);
	console.log(`   Image Generation: ${stats.imageGeneration}`);

	// Demo usage examples
	console.log("\n💡 Usage Examples:");
	console.log("");
	console.log("// Get all providers");
	console.log("const allProviders = container.get(tokens.Providers)");
	console.log("");
	console.log("// Get providers by capability");
	console.log(
		"const toolProviders = container.get(tokens.ToolCallingProviders)",
	);
	console.log("const visionProviders = container.get(tokens.VisionProviders)");
	console.log("");
	console.log("// Filter providers by capability");
	console.log(
		'const textProviders = allProviders.filter(p => p.capabilities.includes("Text Generation"))',
	);
	console.log('const claude = allProviders.find(p => p.name === "claude")');
	console.log("");
	console.log("// Type guards for capabilities");
	console.log("if (isToolCallingProvider(provider)) {");
	console.log("  await provider.injectTools(tools)");
	console.log("}");

	console.log("\n✅ Demo completed successfully!");
	console.log("\n🔗 Learn more:");
	console.log("   Documentation: docs/architecture/di/");
	console.log("   Provider interfaces: packages/contracts/src/providers/");
	console.log("   Usage examples: packages/providers/src/cli/demo.ts");
}

// Handle graceful shutdown
process.on("SIGINT", () => {
	console.log("\n\n👋 Demo interrupted by user");
	process.exit(0);
});

process.on("SIGTERM", () => {
	console.log("\n\n👋 Demo terminated");
	process.exit(0);
});

// Run demo if this file is executed directly
if (require.main === module) {
	runDemo().catch((error) => {
		console.error("❌ Demo failed:", error);
		process.exit(1);
	});
}

export { runDemo };
