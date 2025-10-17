import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from '../../atoms/button/Button'
import { ThemeProvider, useSemanticColors, useThemeContext, useThemeValue } from './ThemeProvider'
import type { ThemeName } from './theme'

const meta = {
	title: 'Themes/ThemeProvider',
	component: ThemeProvider,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof ThemeProvider>

export default meta
type Story = StoryObj<typeof meta>

// Demo component to showcase theme functionality
const ThemeDemo = () => {
	const { currentTheme, switchTheme, availableThemes, isDark, isLight } = useThemeContext()
	const semanticColors = useSemanticColors()
	const { theme } = useThemeValue()

	return (
		<div style={{ padding: '20px', fontFamily: theme.fonts?.['--font-interface'] }}>
			<h2 style={{ color: semanticColors.h2, marginBottom: '16px' }}>Theme Showcase</h2>

			<div style={{ marginBottom: '24px' }}>
				<h3 style={{ color: semanticColors.h3, marginBottom: '12px' }}>Theme Controls</h3>
				<p style={{ color: semanticColors.text, marginBottom: '12px' }}>
					Current Theme: <strong>{currentTheme}</strong> ({isDark ? 'Dark' : isLight ? 'Light' : 'Unknown'} Mode)
				</p>
				<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
					{availableThemes.map((themeName) => (
						<Button
							key={themeName}
							variant={currentTheme === themeName ? 'primary' : 'default'}
							onClick={() => switchTheme(themeName)}
						>
							{themeName}
						</Button>
					))}
				</div>
			</div>

			<div style={{ marginBottom: '24px' }}>
				<h3 style={{ color: semanticColors.h3, marginBottom: '12px' }}>Typography Colors</h3>
				<div style={{ display: 'grid', gap: '8px' }}>
					<p style={{ color: semanticColors.text }}>Normal Text Color</p>
					<p style={{ color: semanticColors.textMuted }}>Muted Text Color</p>
					<p style={{ color: semanticColors.textFaint }}>Faint Text Color</p>
					<h1 style={{ color: semanticColors.h1, margin: '8px 0' }}>Heading 1</h1>
					<h2 style={{ color: semanticColors.h2, margin: '8px 0' }}>Heading 2</h2>
					<h3 style={{ color: semanticColors.h3, margin: '8px 0' }}>Heading 3</h3>
					<strong style={{ color: semanticColors.strong }}>Strong Text</strong>
					<em style={{ color: semanticColors.em, marginLeft: '8px' }}>Emphasis Text</em>
					<blockquote
						style={{
							color: semanticColors.quote,
							borderLeft: `3px solid ${semanticColors.border}`,
							paddingLeft: '12px',
							margin: '12px 0'
						}}
					>
						Blockquote text with semantic coloring
					</blockquote>
				</div>
			</div>

			<div style={{ marginBottom: '24px' }}>
				<h3 style={{ color: semanticColors.h3, marginBottom: '12px' }}>Interactive Elements</h3>
				<div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
					<Button variant='primary'>Primary Button</Button>
					<Button variant='default'>Default Button</Button>
					<Button variant='danger'>Danger Button</Button>
				</div>
				<p style={{ color: semanticColors.textMuted, fontSize: '14px' }}>
					Hover over buttons to see interactive states
				</p>
			</div>

			<div style={{ marginBottom: '24px' }}>
				<h3 style={{ color: semanticColors.h3, marginBottom: '12px' }}>Status Colors</h3>
				<div style={{ display: 'grid', gap: '8px' }}>
					<p style={{ color: semanticColors.success }}>✅ Success message</p>
					<p style={{ color: semanticColors.error }}>❌ Error message</p>
					<p style={{ color: semanticColors.accent }}>🔗 Accent text</p>
					<p
						style={{
							color: semanticColors.text,
							backgroundColor: semanticColors.backgroundSecondary,
							padding: '8px',
							borderRadius: '4px'
						}}
					>
						Secondary background example
					</p>
				</div>
			</div>

			<div style={{ marginBottom: '24px' }}>
				<h3 style={{ color: semanticColors.h3, marginBottom: '12px' }}>Color Palette</h3>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
					<div style={{ padding: '8px', borderRadius: '4px', backgroundColor: semanticColors.blue, color: 'white' }}>
						Blue
					</div>
					<div style={{ padding: '8px', borderRadius: '4px', backgroundColor: semanticColors.pink, color: 'white' }}>
						Pink
					</div>
					<div style={{ padding: '8px', borderRadius: '4px', backgroundColor: semanticColors.green, color: 'white' }}>
						Green
					</div>
					<div style={{ padding: '8px', borderRadius: '4px', backgroundColor: semanticColors.yellow, color: 'black' }}>
						Yellow
					</div>
					<div style={{ padding: '8px', borderRadius: '4px', backgroundColor: semanticColors.orange, color: 'white' }}>
						Orange
					</div>
					<div style={{ padding: '8px', borderRadius: '4px', backgroundColor: semanticColors.red, color: 'white' }}>
						Red
					</div>
					<div style={{ padding: '8px', borderRadius: '4px', backgroundColor: semanticColors.purple, color: 'white' }}>
						Purple
					</div>
				</div>
			</div>

			<div
				style={{
					marginTop: '24px',
					padding: '16px',
					backgroundColor: semanticColors.backgroundSecondary,
					borderRadius: '8px',
					border: `1px solid ${semanticColors.border}`
				}}
			>
				<h3 style={{ color: semanticColors.h3, marginBottom: '8px' }}>Theme Information</h3>
				<p style={{ color: semanticColors.textMuted, fontSize: '14px' }}>
					Theme system provides consistent styling across all components with support for light/dark modes and semantic
					color mapping.
				</p>
			</div>
		</div>
	)
}

const renderThemeProvider: Story['render'] = (args) => <ThemeProvider {...args} />

const defaultArgs: Story['args'] = {
	children: <ThemeDemo />
}

export const Default: Story = {
	args: {
		...defaultArgs,
		initialTheme: 'things-v2-light'
	},
	render: renderThemeProvider
}

export const ThingsV2Light: Story = {
	args: {
		...defaultArgs,
		initialTheme: 'things-v2-light'
	},
	render: renderThemeProvider
}

export const ThingsV2Dark: Story = {
	args: {
		...defaultArgs,
		initialTheme: 'things-v2-dark'
	},
	render: renderThemeProvider
}

export const MinimalLight: Story = {
	args: {
		...defaultArgs,
		initialTheme: 'minimal-light'
	},
	render: renderThemeProvider
}

export const MinimalDark: Story = {
	args: {
		...defaultArgs,
		initialTheme: 'minimal-dark'
	},
	render: renderThemeProvider
}

export const ThemeSwitcher: Story = {
	args: {
		...defaultArgs,
		initialTheme: 'things-v2-light'
	},
	render: (args) => {
		const [currentTheme, setCurrentTheme] = useState(args.initialTheme ?? 'things-v2-light')

		return (
			<div style={{ padding: '20px' }}>
				<div style={{ marginBottom: '20px' }}>
					<h3>Theme Switcher Demo</h3>
					<div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
						{['things-v2-light', 'things-v2-dark', 'minimal-light', 'minimal-dark'].map((theme) => (
							<Button
								key={theme}
								variant={currentTheme === theme ? 'primary' : 'default'}
								onClick={() => setCurrentTheme(theme as ThemeName)}
							>
								{theme}
							</Button>
						))}
					</div>
				</div>
				<ThemeProvider {...args} initialTheme={currentTheme as any}>
					{args.children}
				</ThemeProvider>
			</div>
		)
	}
}

export const ComponentIntegration: Story = {
	args: {
		initialTheme: 'things-v2-light',
		children: (
			<div style={{ padding: '20px' }}>
				<h2>Component Integration Example</h2>
				<p>This shows how ThemeProvider integrates with other components.</p>
				<div style={{ marginTop: '16px' }}>
					<Button variant='primary'>Themed Button</Button>
				</div>
			</div>
		)
	},
	render: renderThemeProvider
}
