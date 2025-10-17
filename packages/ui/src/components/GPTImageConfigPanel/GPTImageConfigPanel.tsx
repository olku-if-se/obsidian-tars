import { Slider, Select, SettingRow } from '../../atoms'
import styles from './GPTImageConfigPanel.module.css'

export interface GptImageOptions {
	displayWidth?: number
	n?: number
	size?: 'auto' | '1024x1024' | '1536x1024' | '1024x1536'
	output_format?: 'png' | 'jpeg' | 'webp'
	quality?: 'auto' | 'high' | 'medium' | 'low'
	background?: 'auto' | 'transparent' | 'opaque'
	output_compression?: number
}

export interface GPTImageConfigPanelProps {
	options: GptImageOptions
	onChange: (updates: Partial<GptImageOptions>) => void
	disabled?: boolean
}

export const GPTImageConfigPanel = ({ options, onChange, disabled = false }: GPTImageConfigPanelProps) => {
	const handleDisplayWidthChange = (value: number) => {
		onChange({ displayWidth: value })
	}

	const handleNumberChange = (value: number) => {
		onChange({ n: value })
	}

	const handleSizeChange = (value: string) => {
		onChange({ size: value as GptImageOptions['size'] })
	}

	const handleFormatChange = (value: string) => {
		onChange({ output_format: value as GptImageOptions['output_format'] })
	}

	const handleQualityChange = (value: string) => {
		onChange({ quality: value as GptImageOptions['quality'] })
	}

	const handleBackgroundChange = (value: string) => {
		onChange({ background: value as GptImageOptions['background'] })
	}

	const handleCompressionChange = (value: number) => {
		onChange({ output_compression: value })
	}

	return (
		<div className={styles.gptImageConfigPanel}>
			<SettingRow
				name="Image Display Width"
				description="Example: 400px width would output as ![[image.jpg|400]]"
			>
				<Slider
					min={200}
					max={800}
					step={100}
					value={options.displayWidth || 400}
					onChange={(e) => handleDisplayWidthChange(Number(e.target.value))}
					disabled={disabled}
					className={styles.slider}
					showValue
					valueFormatter={(value) => `${value}px`}
				/>
			</SettingRow>

			<SettingRow
				name="Number of images"
				description="Number of images to generate (1-5)"
			>
				<Slider
					min={1}
					max={5}
					step={1}
					value={options.n || 1}
					onChange={(e) => handleNumberChange(Number(e.target.value))}
					disabled={disabled}
					className={styles.slider}
					showValue
					valueFormatter={(value) => `${value} image${value !== 1 ? 's' : ''}`}
				/>
			</SettingRow>

			<SettingRow name="Image size">
				<Select
					value={options.size || 'auto'}
					onChange={(e) => handleSizeChange(e.target.value)}
					disabled={disabled}
					className={styles.select}
				>
					<option value="auto">Auto</option>
					<option value="1024x1024">1024x1024</option>
					<option value="1536x1024">1536x1024 (landscape)</option>
					<option value="1024x1536">1024x1536 (portrait)</option>
				</Select>
			</SettingRow>

			<SettingRow name="Output format">
				<Select
					value={options.output_format || 'png'}
					onChange={(e) => handleFormatChange(e.target.value)}
					disabled={disabled}
					className={styles.select}
				>
					<option value="png">PNG</option>
					<option value="jpeg">JPEG</option>
					<option value="webp">WEBP</option>
				</Select>
			</SettingRow>

			<SettingRow
				name="Quality"
				description="Quality level for generated images. default: Auto"
			>
				<Select
					value={options.quality || 'auto'}
					onChange={(e) => handleQualityChange(e.target.value)}
					disabled={disabled}
					className={styles.select}
				>
					<option value="auto">Auto</option>
					<option value="high">High</option>
					<option value="medium">Medium</option>
					<option value="low">Low</option>
				</Select>
			</SettingRow>

			<SettingRow
				name="Background"
				description="Background of the generated image. default: Auto"
			>
				<Select
					value={options.background || 'auto'}
					onChange={(e) => handleBackgroundChange(e.target.value)}
					disabled={disabled}
					className={styles.select}
				>
					<option value="auto">Auto</option>
					<option value="transparent">Transparent</option>
					<option value="opaque">Opaque</option>
				</Select>
			</SettingRow>

			{(options.output_format === 'webp' || options.output_format === 'jpeg') && (
				<SettingRow
					name="Output compression"
					description="Compression level of the output image, 10% - 100%. Only for webp or jpeg output format"
				>
					<Slider
						min={10}
						max={100}
						step={10}
						value={options.output_compression || 80}
						onChange={(e) => handleCompressionChange(Number(e.target.value))}
						disabled={disabled}
						className={styles.slider}
						showValue
						valueFormatter={(value) => `${value}%`}
					/>
				</SettingRow>
			)}

			<div className={styles.infoBox}>
				<h4>🎨 GPT Image Generation Tips</h4>
				<ul>
					<li>
						<strong>Display Width:</strong> Controls the width attribute in Obsidian markdown image links
					</li>
					<li>
						<strong>Number of Images:</strong> Generate 1-5 images in a single request
					</li>
					<li>
						<strong>Size Options:</strong> Choose between square, landscape, or portrait formats
					</li>
					<li>
						<strong>Format:</strong> PNG for quality, JPEG for smaller files, WEBP for best compression
					</li>
					<li>
						<strong>Compression:</strong> Higher values = better quality, larger files
					</li>
				</ul>
			</div>

			<div className={styles.exampleBox}>
				<h5>📝 Example Output</h5>
				<code>
					![[generated-image.jpg|{options.displayWidth || 400}]]
				</code>
			</div>
		</div>
	)
}