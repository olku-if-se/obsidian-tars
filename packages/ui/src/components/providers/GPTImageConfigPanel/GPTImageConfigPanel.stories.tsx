import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { GPTImageConfigPanel, type GptImageOptions } from './GPTImageConfigPanel'

const meta = {
	title: 'Providers/GPTImageConfigPanel',
	component: GPTImageConfigPanel,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof GPTImageConfigPanel>

export default meta
type Story = StoryObj<typeof meta>

// Default state with empty configuration
export const Default: Story = {
	args: {
		options: {},
		onChange: (updates) => console.log('GPT Image config changed:', updates)
	}
}

// With default configuration
export const WithDefaults: Story = {
	args: {
		options: {
			displayWidth: 400,
			n: 1,
			size: 'auto',
			output_format: 'png',
			quality: 'auto',
			background: 'auto'
		},
		onChange: (updates) => console.log('GPT Image config changed:', updates)
	}
}

// High quality configuration
export const HighQuality: Story = {
	args: {
		options: {
			displayWidth: 600,
			n: 1,
			size: '1024x1024',
			output_format: 'png',
			quality: 'high',
			background: 'transparent'
		},
		onChange: (updates) => console.log('GPT Image config changed:', updates)
	}
}

// Multiple images configuration
export const MultipleImages: Story = {
	args: {
		options: {
			displayWidth: 400,
			n: 4,
			size: 'auto',
			output_format: 'jpeg',
			quality: 'medium',
			background: 'opaque',
			output_compression: 70
		},
		onChange: (updates) => console.log('GPT Image config changed:', updates)
	}
}

// Landscape configuration
export const Landscape: Story = {
	args: {
		options: {
			displayWidth: 800,
			n: 1,
			size: '1536x1024',
			output_format: 'webp',
			quality: 'high',
			background: 'opaque',
			output_compression: 85
		},
		onChange: (updates) => console.log('GPT Image config changed:', updates)
	}
}

// Portrait configuration
export const Portrait: Story = {
	args: {
		options: {
			displayWidth: 500,
			n: 2,
			size: '1024x1536',
			output_format: 'png',
			quality: 'auto',
			background: 'transparent'
		},
		onChange: (updates) => console.log('GPT Image config changed:', updates)
	}
}

// Small images for thumbnails
export const Thumbnails: Story = {
	args: {
		options: {
			displayWidth: 200,
			n: 5,
			size: '1024x1024',
			output_format: 'jpeg',
			quality: 'medium',
			background: 'opaque',
			output_compression: 60
		},
		onChange: (updates) => console.log('GPT Image config changed:', updates)
	}
}

// Optimized for web (WEBP format)
export const WebOptimized: Story = {
	args: {
		options: {
			displayWidth: 600,
			n: 1,
			size: '1024x1024',
			output_format: 'webp',
			quality: 'medium',
			background: 'auto',
			output_compression: 75
		},
		onChange: (updates) => console.log('GPT Image config changed:', updates)
	}
}

// Disabled state
export const Disabled: Story = {
	args: {
		options: {
			displayWidth: 400,
			n: 1,
			size: 'auto',
			output_format: 'png',
			quality: 'high'
		},
		onChange: (updates) => console.log('GPT Image config changed:', updates),
		disabled: true
	}
}

// Interactive story with state management
export const Interactive: Story = {
	render: () => {
		const [imageOptions, setImageOptions] = useState<GptImageOptions>({
			displayWidth: 400,
			n: 1,
			size: 'auto',
			output_format: 'png',
			quality: 'auto',
			background: 'auto'
		})

		const handleChange = (updates: Partial<GptImageOptions>) => {
			setImageOptions((prev) => ({ ...prev, ...updates }))
		}

		const getOutputExample = () => {
			const width = imageOptions.displayWidth || 400
			const format = imageOptions.output_format || 'png'
			return `![[generated-image.${format}|${width}]]`
		}

		return (
			<div style={{ maxWidth: '700px' }}>
				<GPTImageConfigPanel options={imageOptions} onChange={handleChange} />
				<div
					style={{
						marginTop: '24px',
						padding: '16px',
						backgroundColor: '#f5f5f5',
						borderRadius: '4px',
						fontFamily: 'monospace',
						fontSize: '14px'
					}}
				>
					<h4>Current Configuration:</h4>
					<pre>{JSON.stringify(imageOptions, null, 2)}</pre>

					<div style={{ marginTop: '16px' }}>
						<h4>Example Output:</h4>
						<code style={{ backgroundColor: '#e9ecef', padding: '4px 8px', borderRadius: '4px' }}>
							{getOutputExample()}
						</code>
					</div>

					<div style={{ marginTop: '16px' }}>
						<h4>Configuration Summary:</h4>
						<ul>
							<li>Images per request: {imageOptions.n || 1}</li>
							<li>Display size: {imageOptions.size || 'auto'}</li>
							<li>Format: {imageOptions.output_format || 'png'}</li>
							<li>Quality: {imageOptions.quality || 'auto'}</li>
							<li>Background: {imageOptions.background || 'auto'}</li>
							{imageOptions.output_compression && <li>Compression: {imageOptions.output_compression}%</li>}
						</ul>
					</div>
				</div>
			</div>
		)
	}
}

// Format comparison story
export const FormatComparison: Story = {
	render: () => {
		const [selectedFormat, setSelectedFormat] = useState<'png' | 'jpeg' | 'webp'>('png')

		const formatConfigs = {
			png: {
				name: 'PNG',
				description: 'Best quality, supports transparency, larger file size',
				config: {
					output_format: 'png' as const,
					quality: 'high' as const,
					background: 'transparent' as const
				}
			},
			jpeg: {
				name: 'JPEG',
				description: 'Smaller file size, no transparency, good for photos',
				config: {
					output_format: 'jpeg' as const,
					quality: 'medium' as const,
					background: 'opaque' as const,
					output_compression: 80
				}
			},
			webp: {
				name: 'WEBP',
				description: 'Best compression ratio, modern format, good balance',
				config: {
					output_format: 'webp' as const,
					quality: 'high' as const,
					background: 'auto' as const,
					output_compression: 85
				}
			}
		}

		const currentConfig = formatConfigs[selectedFormat].config

		return (
			<div style={{ maxWidth: '700px' }}>
				<div style={{ marginBottom: '24px' }}>
					<h3>Select Output Format:</h3>
					<div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
						{Object.entries(formatConfigs).map(([format, info]) => (
							<button
								key={format}
								onClick={() => setSelectedFormat(format as 'png' | 'jpeg' | 'webp')}
								style={{
									padding: '8px 16px',
									backgroundColor: selectedFormat === format ? '#007bff' : '#f8f9fa',
									color: selectedFormat === format ? 'white' : 'black',
									border: '1px solid #dee2e6',
									borderRadius: '4px',
									cursor: 'pointer'
								}}
							>
								{info.name}
							</button>
						))}
					</div>
					<p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{formatConfigs[selectedFormat].description}</p>
				</div>

				<GPTImageConfigPanel options={currentConfig} onChange={(updates) => console.log('Config changed:', updates)} />

				<div
					style={{
						marginTop: '24px',
						padding: '16px',
						backgroundColor: '#e9ecef',
						borderRadius: '4px'
					}}
				>
					<h4>Format Characteristics:</h4>
					<ul>
						<li>
							<strong>File Extension:</strong> .{selectedFormat}
						</li>
						<li>
							<strong>Best For:</strong>{' '}
							{selectedFormat === 'png'
								? 'Graphics, logos, images with transparency'
								: selectedFormat === 'jpeg'
									? 'Photographs, complex images'
									: 'Web use, optimal balance of quality and size'}
						</li>
						<li>
							<strong>Transparency:</strong>{' '}
							{selectedFormat === 'png'
								? 'Yes'
								: selectedFormat === 'jpeg'
									? 'No'
									: 'Conditional (depends on background setting)'}
						</li>
						<li>
							<strong>Compression:</strong>{' '}
							{selectedFormat === 'png'
								? 'Lossless'
								: selectedFormat === 'jpeg'
									? 'Lossy'
									: 'Lossy (more efficient than JPEG)'}
						</li>
					</ul>
				</div>
			</div>
		)
	}
}

// Preset configurations for different use cases
export const UseCasePresets: Story = {
	render: () => {
		const presets = {
			'blog-post': {
				name: 'Blog Post Images',
				description: 'Optimized for blog content with good balance',
				config: {
					displayWidth: 600,
					n: 1,
					size: '1536x1024' as const,
					output_format: 'webp' as const,
					quality: 'high' as const,
					background: 'opaque' as const,
					output_compression: 80
				}
			},
			'social-media': {
				name: 'Social Media',
				description: 'Square images perfect for social posts',
				config: {
					displayWidth: 400,
					n: 3,
					size: '1024x1024' as const,
					output_format: 'jpeg' as const,
					quality: 'medium' as const,
					background: 'opaque' as const,
					output_compression: 70
				}
			},
			documentation: {
				name: 'Documentation',
				description: 'High-quality images with transparency support',
				config: {
					displayWidth: 500,
					n: 1,
					size: 'auto' as const,
					output_format: 'png' as const,
					quality: 'high' as const,
					background: 'transparent' as const
				}
			},
			thumbnails: {
				name: 'Thumbnails',
				description: 'Small images for previews and galleries',
				config: {
					displayWidth: 200,
					n: 5,
					size: '1024x1024' as const,
					output_format: 'webp' as const,
					quality: 'medium' as const,
					background: 'auto' as const,
					output_compression: 60
				}
			}
		}

		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
				<h3>Preset Configurations for Different Use Cases</h3>
				{Object.entries(presets).map(([key, preset]) => (
					<div
						key={key}
						style={{
							padding: '16px',
							border: '1px solid #e0e0e0',
							borderRadius: '8px',
							backgroundColor: '#fafafa'
						}}
					>
						<h4 style={{ marginTop: 0, marginBottom: '8px' }}>{preset.name}</h4>
						<p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>{preset.description}</p>
						<GPTImageConfigPanel
							options={preset.config}
							onChange={(updates) => console.log(`${preset.name} changed:`, updates)}
						/>
					</div>
				))}
			</div>
		)
	}
}
