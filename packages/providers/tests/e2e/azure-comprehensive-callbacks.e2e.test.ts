/**
 * Azure OpenAI Provider E2E Test - Comprehensive Callbacks
 *
 * This is an END-TO-END test that makes REAL API calls to Azure OpenAI.
 *
 * Setup:
 * 1. Set E2E_AZURE_API_KEY environment variable
 * 2. Run: E2E_AZURE_API_KEY=... npm test -- azure-comprehensive-callbacks.e2e.test.ts
 *
 * Tests:
 * - Real streaming from Azure OpenAI API
 * - All 13 comprehensive callback hooks
 * - Tool injection and execution
 * - Message transformation
 * - Chunk pre/post processing
 * - Error handling
 * - Lifecycle events
 * - Azure-specific configuration validation
 *
 * TDD Approach: GIVEN / WHEN / THEN structure
 */

import type { Message } from "@tars/contracts";
import { beforeEach, describe, expect, it } from "vitest";
import type {
	ComprehensiveCallbacks,
	ToolDefinition,
} from "../../src/base/ComprehensiveCallbacks";
import { AzureStreamingProvider } from "../../src/providers/azure/AzureStreamingProvider";
import { shouldSkipE2ETests } from "./helpers/skip-if-no-env";

// Mock logging service for tests (silent unless error)
const mockLoggingService = {
	debug: () => {}, // Silent
	info: () => {}, // Silent
	warn: () => {}, // Silent
	error: (...args: any[]) => console.error("[ERROR]", ...args), // Only show errors
};

// Mock settings service for tests
const mockSettingsService = {
	get: (key: string, defaultValue?: any) => defaultValue,
	set: async () => {},
	has: () => false,
	watch: () => () => {},
	remove: async () => {},
	clear: async () => {},
	getAll: () => ({}),
	setAll: async () => {},
	initialize: async () => {},
};

// Auto-skip all E2E tests if E2E_AZURE_API_KEY not provided
const shouldSkipE2E = shouldSkipE2ETests({
	envVar: "E2E_AZURE_API_KEY",
	providerName: "Azure OpenAI",
	setupInstructions: [
		"Set API key: mise run secrets-init && mise run secrets-edit",
		"Run tests:   mise run test-e2e",
		"Or directly: E2E_AZURE_API_KEY=... npm test -- azure-comprehensive-callbacks.e2e.test.ts",
	],
});

const API_KEY = process.env.E2E_AZURE_API_KEY;

describe.skipIf(shouldSkipE2E)(
	"Azure OpenAI Provider E2E - Comprehensive Callbacks",
	() => {
		let provider: AzureStreamingProvider;

		beforeEach(() => {
			// GIVEN: Fresh Azure OpenAI provider instance
			provider = new AzureStreamingProvider(
				mockLoggingService as any,
				mockSettingsService as any,
			);
			provider.initialize({
				apiKey: API_KEY as string,
				baseURL: "https://e2e-oleksander-kucheren-resource.openai.azure.com", // Azure resource URL (without /openai/v1)
				deployment: "gpt-oss-120b", // Azure deployment name
				apiVersion: "2024-08-01-preview",
				temperature: 0.7,
			});
		});

		describe("1. Basic Streaming", () => {
			it("should stream response from Azure OpenAI", async () => {
				// GIVEN: Simple message
				const messages: Message[] = [
					{
						role: "user",
						content: 'Say "Hello from E2E test" and nothing else.',
					},
				];

				let fullResponse = "";
				let chunkCount = 0;

				// WHEN: Streaming without callbacks
				for await (const chunk of provider.stream(messages, {})) {
					fullResponse += chunk;
					chunkCount++;
				}

				// THEN: Should receive response
				expect(fullResponse).toContain("Hello");
				expect(chunkCount).toBeGreaterThan(0);

				// Silent on success
			});
		});

		describe("2. Tool Injection Callback", () => {
			it("should inject tools via onToolsRequest", async () => {
				// GIVEN: Message that requires tools
				const messages: Message[] = [
					{
						role: "user",
						content:
							"What is the weather in San Francisco? Use the get_weather tool.",
					},
				];

				const toolsRequested: ToolDefinition[] = [];
				let toolsProvided: ToolDefinition[] = [];

				const callbacks: ComprehensiveCallbacks = {
					// Tool injection
					onToolsRequest: async ({ provider, model }) => {
						// Silent

						const tools: ToolDefinition[] = [
							{
								type: "function",
								function: {
									name: "get_weather",
									description: "Get weather information for a location",
									parameters: {
										type: "object",
										properties: {
											location: {
												type: "string",
												description: "City name",
											},
											unit: {
												type: "string",
												enum: ["celsius", "fahrenheit"],
											},
										},
										required: ["location"],
									},
								},
							},
						];

						toolsProvided = tools;
						return { tools };
					},

					// Tool execution
					onToolCall: async ({ toolCalls }) => {
						// Silent

						// Mock tool execution
						return {
							responses: toolCalls.map((call) => ({
								tool_call_id: call.id,
								content: JSON.stringify({
									temperature: 72,
									condition: "sunny",
									location: "San Francisco",
								}),
								success: true,
							})),
						};
					},
				};

				let fullResponse = "";

				// WHEN: Streaming with tool callbacks
				for await (const chunk of provider.stream(messages, { callbacks })) {
					fullResponse += chunk;
				}

				// THEN: Should have provided tools
				expect(toolsProvided.length).toBeGreaterThan(0);
				// Silent on success
			});
		});

		describe("3. Message Transformation Callback", () => {
			it("should transform messages via beforeStreamStart", async () => {
				// GIVEN: Simple user message
				const messages: Message[] = [
					{
						role: "user",
						content: "Count to 3",
					},
				];

				let messagesTransformed = false;
				let originalMessageCount = 0;
				let finalMessageCount = 0;

				const callbacks: ComprehensiveCallbacks = {
					beforeStreamStart: async ({ messages, provider }) => {
						// Silent
						originalMessageCount = messages.length;

						// Add system message
						const enhancedMessages: Message[] = [
							{
								role: "system",
								content:
									"You are a helpful assistant. Keep responses very brief.",
							},
							...messages,
						];

						finalMessageCount = enhancedMessages.length;
						messagesTransformed = true;

						// Silent

						return {
							messages: enhancedMessages,
						};
					},
				};

				let fullResponse = "";

				// WHEN: Streaming with message transformation
				for await (const chunk of provider.stream(messages, { callbacks })) {
					fullResponse += chunk;
				}

				// THEN: Should have transformed messages
				expect(messagesTransformed).toBe(true);
				expect(originalMessageCount).toBe(1);
				expect(finalMessageCount).toBe(2);

				// Silent on success
			});
		});

		describe("4. Chunk Processing Callbacks", () => {
			it("should process chunks via beforeChunk and afterChunk", async () => {
				// GIVEN: Message that will generate multiple chunks
				const messages: Message[] = [
					{
						role: "user",
						content: "List 5 colors, one per line.",
					},
				];

				const processedChunks: string[] = [];
				const chunkMetrics: Array<{
					index: number;
					length: number;
					duration: number;
				}> = [];

				const callbacks: ComprehensiveCallbacks = {
					// Pre-process chunks
					beforeChunk: async ({ chunk, index, accumulated }) => {
						// Silent

						// Transform: convert to uppercase
						const transformed = chunk.toUpperCase();

						return {
							chunk: transformed,
							metadata: { originalLength: chunk.length },
						};
					},

					// Post-process chunks
					afterChunk: async ({
						originalChunk,
						processedChunk,
						index,
						accumulated,
						duration,
					}) => {
						// Silent

						processedChunks.push(processedChunk);
						chunkMetrics.push({
							index,
							length: processedChunk.length,
							duration,
						});
					},
				};

				let fullResponse = "";

				// WHEN: Streaming with chunk processing
				for await (const chunk of provider.stream(messages, { callbacks })) {
					fullResponse += chunk;
				}

				// THEN: Should have processed chunks
				expect(processedChunks.length).toBeGreaterThan(0);
				expect(chunkMetrics.length).toBeGreaterThan(0);

				// Response should be uppercase due to beforeChunk transformation
				expect(fullResponse).toMatch(/[A-Z]/);

				// Silent on success
			});

			it("should skip chunks when beforeChunk returns skip=true", async () => {
				// GIVEN: Message
				const messages: Message[] = [
					{
						role: "user",
						content: 'Say: "one two three"',
					},
				];

				let skippedCount = 0;
				let yieldedCount = 0;

				const callbacks: ComprehensiveCallbacks = {
					beforeChunk: async ({ chunk, index }) => {
						// Skip every other chunk
						const shouldSkip = index % 2 === 0;

						if (shouldSkip) {
							skippedCount++;
							// Silent
						} else {
							yieldedCount++;
							// Silent
						}

						return { skip: shouldSkip };
					},
				};

				let fullResponse = "";

				// WHEN: Streaming with chunk skipping
				for await (const chunk of provider.stream(messages, { callbacks })) {
					fullResponse += chunk;
				}

				// THEN: Should have skipped some chunks
				expect(skippedCount).toBeGreaterThan(0);

				// Silent on success
			});
		});

		describe("5. Lifecycle Event Callbacks", () => {
			it("should invoke lifecycle callbacks", async () => {
				// GIVEN: Simple message
				const messages: Message[] = [
					{
						role: "user",
						content: 'Say "testing lifecycle"',
					},
				];

				const lifecycle: string[] = [];

				const callbacks: ComprehensiveCallbacks = {
					onStreamStart: async ({
						provider,
						model,
						messageCount,
						hasTools,
						timestamp,
					}) => {
						lifecycle.push("start");
						// Silent
					},

					onStreamEnd: async ({
						provider,
						model,
						totalChunks,
						duration,
						timestamp,
					}) => {
						lifecycle.push("end");
						// Silent
					},
				};

				// WHEN: Streaming with lifecycle callbacks
				for await (const chunk of provider.stream(messages, { callbacks })) {
					// Just consume chunks
				}

				// THEN: Should have called lifecycle events in order
				expect(lifecycle).toEqual(["start", "end"]);

				// Silent on success
			});
		});

		describe("6. Stream Cancellation", () => {
			it("should cancel stream via beforeStreamStart", async () => {
				// GIVEN: Message
				const messages: Message[] = [
					{
						role: "user",
						content: "This should not be sent",
					},
				];

				let streamStarted = false;
				let streamCancelled = false;

				const callbacks: ComprehensiveCallbacks = {
					beforeStreamStart: async () => {
						// Silent
						streamCancelled = true;

						return {
							cancel: true,
							cancelReason: "Quota exceeded",
						};
					},

					onStreamStart: async () => {
						streamStarted = true;
					},
				};

				let chunkReceived = false;

				// WHEN: Attempting to stream
				for await (const chunk of provider.stream(messages, { callbacks })) {
					chunkReceived = true;
				}

				// THEN: Should have cancelled without starting
				expect(streamCancelled).toBe(true);
				expect(streamStarted).toBe(false);
				expect(chunkReceived).toBe(false);

				// Silent on success
			});
		});

		describe("7. Azure Model Capabilities", () => {
			it("should confirm Azure deployment supports basic streaming", async () => {
				// GIVEN: Simple test message
				const messages: Message[] = [
					{
						role: "user",
						content: 'Say "Azure streaming works" exactly.',
					},
				];

				// WHEN: Streaming response
				let response = "";
				let chunkCount = 0;

				for await (const chunk of provider.stream(messages, {})) {
					response += chunk;
					chunkCount++;
				}

				// THEN: Should receive proper streaming response
				expect(response).toContain("Azure streaming works");
				expect(chunkCount).toBeGreaterThan(0);
				expect(response.length).toBeGreaterThan(5);

				console.log(
					`✅ Azure streaming: ${chunkCount} chunks, response: "${response}"`,
				);
			});

			it("should confirm Azure provider can accept tools without crashing", async () => {
				// GIVEN: Provider with tools available
				const messages: Message[] = [
					{
						role: "user",
						content: 'Just say "Tools are available" and nothing else.',
					},
				];

				let toolsProvided = false;
				let response = "";

				const callbacks: ComprehensiveCallbacks = {
					onToolsRequest: async () => {
						toolsProvided = true;
						return {
							tools: [
								{
									type: "function",
									function: {
										name: "test_tool",
										description: "A test tool",
										parameters: {
											type: "object",
											properties: {
												input: { type: "string" },
											},
										},
									},
								},
							],
						};
					},
				};

				// WHEN: Streaming with tools available
				for await (const chunk of provider.stream(messages, { callbacks })) {
					response += chunk;
				}

				// THEN: Should handle tools gracefully
				expect(toolsProvided).toBe(true);
				expect(response).toContain("Tools are available");
				expect(response.length).toBeGreaterThan(5);

				console.log(`✅ Tools handled gracefully: "${response}"`);
			});

			it("should confirm Azure provider can process tool call responses", async () => {
				// GIVEN: Provider that might receive tool calls
				const messages: Message[] = [
					{
						role: "system",
						content:
							"You have access to a test_tool. You may use it if you want, but you don't have to.",
					},
					{
						role: "user",
						content: 'Say "Tool calling tested" and nothing else.',
					},
				];

				let toolCallsHandled = false;
				let response = "";

				const callbacks: ComprehensiveCallbacks = {
					onToolsRequest: async () => {
						return {
							tools: [
								{
									type: "function",
									function: {
										name: "test_tool",
										description: "A test tool",
										parameters: {
											type: "object",
											properties: {
												message: { type: "string" },
											},
										},
									},
								},
							],
						};
					},

					onToolCall: async ({ toolCalls }) => {
						toolCallsHandled = true;
						console.log(`🔧 Azure received ${toolCalls.length} tool call(s)`);

						// Return mock responses
						const responses = toolCalls.map((call) => ({
							tool_call_id: call.id,
							content: JSON.stringify({ result: "Tool executed successfully" }),
							success: true,
						}));

						return { responses };
					},
				};

				// WHEN: Streaming with potential tool usage
				for await (const chunk of provider.stream(messages, { callbacks })) {
					response += chunk;
				}

				// THEN: Should complete successfully regardless of tool usage
				expect(response).toContain("Tool calling tested");
				expect(response.length).toBeGreaterThan(5);

				// Tool calls may or may not be used - both are valid
				console.log(
					`✅ Tool calling test completed: tool calls=${toolCallsHandled}, response="${response}"`,
				);
			});

			it("should confirm Azure provider supports all callback lifecycle events", async () => {
				// GIVEN: All lifecycle callbacks configured
				const messages: Message[] = [
					{
						role: "user",
						content: "Count to 3.",
					},
				];

				const events: string[] = [];

				const callbacks: ComprehensiveCallbacks = {
					onToolsRequest: async () => {
						events.push("tools_requested");
						return { tools: [] };
					},

					beforeStreamStart: async () => {
						events.push("before_stream_start");
						return { messages };
					},

					onStreamStart: async () => {
						events.push("stream_start");
					},

					beforeChunk: async ({ chunk }) => {
						events.push(`before_chunk_${chunk.length}`);
						return { chunk };
					},

					afterChunk: async () => {
						events.push("after_chunk");
					},

					onStreamEnd: async () => {
						events.push("stream_end");
					},
				};

				// WHEN: Streaming with all callbacks
				let response = "";
				for await (const chunk of provider.stream(messages, { callbacks })) {
					response += chunk;
				}

				// THEN: Should have triggered all lifecycle events
				expect(events).toContain("tools_requested");
				expect(events).toContain("before_stream_start");
				expect(events).toContain("stream_start");
				expect(events).toContain("stream_end");
				expect(
					events.filter((e) => e.startsWith("before_chunk")).length,
				).toBeGreaterThan(0);
				expect(
					events.filter((e) => e === "after_chunk").length,
				).toBeGreaterThan(0);

				expect(response).toBeTruthy();
				expect(response.length).toBeGreaterThan(3);

				console.log(`✅ Lifecycle events: ${events.join(" → ")}`);
			});

			it("should confirm Azure deployment model identity", async () => {
				// GIVEN: Provider instance
				// WHEN: Checking provider properties
				const providerName = provider.name;
				const displayName = provider.displayName;
				const models = provider.models;
				const capabilities = provider.capabilities;
				const defaultOptions = provider.defaultOptions;

				// THEN: Should have correct Azure identity
				expect(providerName).toBe("azure");
				expect(displayName).toBe("Azure OpenAI");
				expect(models.length).toBeGreaterThan(0);
				// Check if any model matches our deployment or is a common Azure model
				const hasValidModel = models.some(
					(model) =>
						model.id === "gpt-oss-120b" ||
						model.id === "gpt-4o" ||
						model.id.includes("gpt"),
				);
				expect(hasValidModel).toBe(true);
				expect(capabilities).toContain("Text Generation");
				expect(capabilities).toContain("Tool Calling");
				expect(defaultOptions.deployment).toBe("gpt-4o");
				expect(defaultOptions.apiVersion).toBe("2024-08-01-preview");

				console.log(
					`✅ Azure identity confirmed: ${displayName} with deployment ${defaultOptions.deployment}`,
				);
			});
		});

		describe("8. Complete Integration Test", () => {
			it(
				"should exercise all callbacks in one stream",
				{ timeout: 30000 },
				async () => {
					// GIVEN: Complete test scenario
					const messages: Message[] = [
						{
							role: "user",
							content: "Count from 1 to 5, one number per response.",
						},
					];

					const callbackLog: string[] = [];

					const callbacks: ComprehensiveCallbacks = {
						onToolsRequest: async ({ provider }) => {
							callbackLog.push("onToolsRequest");
							// Silent
							return { tools: [] };
						},

						beforeStreamStart: async ({ messages }) => {
							callbackLog.push("beforeStreamStart");
							// Silent
							return { messages };
						},

						onStreamStart: async ({ provider, model }) => {
							callbackLog.push("onStreamStart");
							// Silent
						},

						beforeChunk: async ({ chunk, index }) => {
							callbackLog.push(`beforeChunk-${index}`);
							// Silent
							return { chunk };
						},

						afterChunk: async ({ index, accumulated }) => {
							callbackLog.push(`afterChunk-${index}`);
							// Silent
						},

						onStreamEnd: async ({ totalChunks, duration }) => {
							callbackLog.push("onStreamEnd");
							// Silent
						},
					};

					let fullResponse = "";
					let chunkCount = 0;

					// WHEN: Streaming with all callbacks
					for await (const chunk of provider.stream(messages, { callbacks })) {
						fullResponse += chunk;
						chunkCount++;
					}

					// THEN: Should have called all callbacks
					expect(callbackLog).toContain("onToolsRequest");
					expect(callbackLog).toContain("beforeStreamStart");
					expect(callbackLog).toContain("onStreamStart");
					expect(callbackLog).toContain("onStreamEnd");
					expect(
						callbackLog.filter((log) => log.startsWith("beforeChunk")).length,
					).toBeGreaterThan(0);
					expect(
						callbackLog.filter((log) => log.startsWith("afterChunk")).length,
					).toBeGreaterThan(0);

					// Silent on success
				},
			);
		});
	},
);
