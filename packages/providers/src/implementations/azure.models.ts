import type { LlmModel } from '@tars/contracts'
import { DeepSeekReasoningProcessor } from './processors/deepSeekReasoningProcessor'

export const azureModelRegistry: LlmModel[] = [
	{
		id: 'o3-mini',
		label: 'O3 Mini',
		description: 'Azure reasoning model optimised for tool use',
		capabilities: ['Text Generation', 'Tool Calling', 'Reasoning']
	},
	{
		id: 'deepseek-r1',
		label: 'DeepSeek-R1',
		description: 'Reasoning model with structured thinking stream',
		capabilities: ['Text Generation', 'Reasoning'],
		systemPrelude: {
			role: 'system',
			content: 'Initiate your response with "🧀\n嗯" at the beginning of every output.'
		},
		createStreamProcessor: () => new DeepSeekReasoningProcessor()
	},
	{
		id: 'phi-4',
		label: 'Phi-4',
		description: 'General-purpose Azure model',
		capabilities: ['Text Generation']
	},
	{
		id: 'o1',
		label: 'O1',
		capabilities: ['Text Generation', 'Reasoning']
	},
	{
		id: 'o1-mini',
		label: 'O1 Mini',
		capabilities: ['Text Generation', 'Reasoning']
	},
	{
		id: 'gpt-4o',
		label: 'GPT-4o',
		capabilities: ['Text Generation', 'Tool Calling']
	},
	{
		id: 'gpt-4o-mini',
		label: 'GPT-4o Mini',
		capabilities: ['Text Generation', 'Tool Calling']
	},
	{
		id: 'gpt-4',
		label: 'GPT-4',
		capabilities: ['Text Generation', 'Tool Calling']
	},
	{
		id: 'gpt-4-32k',
		label: 'GPT-4 32k',
		capabilities: ['Text Generation', 'Tool Calling']
	},
	{
		id: 'gpt-35-turbo',
		label: 'GPT-3.5 Turbo',
		capabilities: ['Text Generation', 'Tool Calling']
	},
	{
		id: 'gpt-35-turbo-16k',
		label: 'GPT-3.5 Turbo 16k',
		capabilities: ['Text Generation', 'Tool Calling']
	}
]
