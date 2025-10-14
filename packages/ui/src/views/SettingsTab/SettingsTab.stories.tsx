import type { Meta, StoryObj } from '@storybook/react'
import { SettingsTab } from './SettingsTab'

const meta = {
  title: 'Views/SettingsTab',
  component: SettingsTab,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SettingsTab>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const WithExpandedSections: Story = {
  render: () => (
    <div>
      <style>{`
        details {
          open: true;
        }
      `}</style>
      <SettingsTab />
    </div>
  ),
}

export const DarkTheme: Story = {
  args: {},
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
}

export const LightTheme: Story = {
  args: {},
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
}