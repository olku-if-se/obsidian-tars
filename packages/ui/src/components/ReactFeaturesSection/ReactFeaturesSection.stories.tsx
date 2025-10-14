import type { Meta, StoryObj } from '@storybook/react'
import { ReactFeaturesSection } from './ReactFeaturesSection'

const meta = {
  title: 'Settings/ReactFeaturesSection',
  component: ReactFeaturesSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ReactFeaturesSection>

export default meta
type Story = StoryObj<typeof meta>

// Mock handlers
const mockHandlers = {
  onToggleFeature: (feature: string, enabled: boolean) => console.log(`Toggle ${feature}:`, enabled),
  onToggleSection: (open: boolean) => console.log('Section toggled:', open),
  onEnableAll: () => console.log('Enable all features'),
  onDisableAll: () => console.log('Disable all features')
}

export const AllDisabled: Story = {
  args: {
    features: {
      reactSettingsTab: false,
      reactStatusBar: false,
      reactModals: false,
      reactMcpUI: false
    },
    expanded: false,
    ...mockHandlers
  }
}

export const PartiallyEnabled: Story = {
  args: {
    features: {
      reactSettingsTab: true,
      reactStatusBar: false,
      reactModals: true,
      reactMcpUI: false
    },
    expanded: true,
    ...mockHandlers
  }
}

export const AllEnabled: Story = {
  args: {
    features: {
      reactSettingsTab: true,
      reactStatusBar: true,
      reactModals: true,
      reactMcpUI: true
    },
    expanded: true,
    ...mockHandlers
  }
}

export const OnlySettingsTab: Story = {
  args: {
    features: {
      reactSettingsTab: true,
      reactStatusBar: false,
      reactModals: false,
      reactMcpUI: false
    },
    expanded: true,
    ...mockHandlers
  }
}

export const Collapsed: Story = {
  args: {
    features: {
      reactSettingsTab: true,
      reactStatusBar: false,
      reactModals: true,
      reactMcpUI: false
    },
    expanded: false,
    ...mockHandlers
  }
}