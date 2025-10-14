import type { Meta, StoryObj } from '@storybook/react'
import { Button, Input, Slider, Toggle } from '../../index'
import { SettingRow } from './SettingRow'

const meta = {
  title: 'Atoms/SettingRow',
  component: SettingRow,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
SettingRow is a flexible atom that provides a consistent layout for settings.
It accepts any children as controls, making it suitable for various setting types
including toggles, inputs, sliders, and button combinations.

## Usage
- Use for individual setting rows with name, description, and controls
- Can accept any React components as children
- Supports both simple and complex control layouts
- Maintains consistent spacing and typography
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      description: 'The setting name/title',
      control: 'text'
    },
    description: {
      description: 'Optional description text below the name',
      control: 'text'
    },
    children: {
      description: 'Control components (buttons, inputs, toggles, etc.)',
      control: false
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text'
    },
    vertical: {
      description: 'Use vertical layout (top/bottom) instead of horizontal (left/right)',
      control: 'boolean'
    }
  }
} satisfies Meta<typeof SettingRow>

export default meta
type Story = StoryObj<typeof meta>

// Basic setting with toggle
export const WithToggle: Story = {
  args: {
    name: 'Enable notifications',
    description: 'Receive notifications when new messages arrive',
    children: (
      <Toggle checked={true} onChange={() => {}} />
    )
  }
}

// Setting with text input
export const WithInput: Story = {
  args: {
    name: 'API Key',
    description: 'Enter your API key for authentication',
    children: (
      <Input
        type="password"
        placeholder="sk-..."
        value="sk-test123"
        onChange={() => {}}
      />
    )
  }
}

// Setting with slider
export const WithSlider: Story = {
  args: {
    name: 'Timeout duration',
    description: 'Set the timeout for API requests in seconds',
    children: (
      <Slider
        min={1}
        max={30}
        step={1}
        value={10}
        showValue
        valueFormatter={(value) => `${value}s`}
        onChange={() => {}}
      />
    )
  }
}

// Setting with multiple buttons
export const WithButtons: Story = {
  args: {
    name: 'Model selection',
    description: 'Choose the AI model to use for responses',
    children: (
      <>
        <Button variant="default" size="sm">Reset</Button>
        <Input
          value="gpt-4"
          onChange={() => {}}
          placeholder="Select model"
        />
        <Button variant="primary" size="sm">Browse</Button>
      </>
    )
  }
}

// Setting with button only
export const WithButtonOnly: Story = {
  args: {
    name: 'Test connection',
    description: 'Verify your API credentials and connectivity',
    children: (
      <Button variant="primary">Test Connection</Button>
    )
  }
}

// Setting without description
export const WithoutDescription: Story = {
  args: {
    name: 'Debug mode',
    children: (
      <Toggle checked={false} onChange={() => {}} />
    )
  }
}

// Complex setting with multiple controls
export const ComplexControls: Story = {
  args: {
    name: 'Advanced configuration',
    description: 'Configure advanced settings with multiple options',
    children: (
      <div className="complex-controls">
        <Toggle checked={true} onChange={() => {}} />
        <Input value="80" onChange={() => {}} />
        <Button variant="default" size="sm">Auto</Button>
        <Button variant="primary" size="sm">Apply</Button>
      </div>
    )
  }
}

// Disabled state example
export const Disabled: Story = {
  args: {
    name: 'Cloud sync',
    description: 'Sync settings across devices (premium feature)',
    children: (
      <>
        <Toggle checked={false} disabled onChange={() => {}} />
        <Button variant="primary" disabled>Upgrade</Button>
      </>
    )
  }
}

// Long description example
export const LongDescription: Story = {
  args: {
    name: 'Internal links for assistant messages',
    description: 'Replace internal links in assistant messages with their referenced content. Note: This feature is generally not recommended as assistant-generated content may contain non-existent links that could lead to unexpected behavior.',
    children: (
      <Toggle checked={false} onChange={() => {}} />
    )
  }
}

// Vertical layout example
export const VerticalLayout: Story = {
  args: {
    name: 'System message',
    description: 'Configure the default system message that will be used when no system message is provided in the conversation.',
    vertical: true,
    children: (
      <div className="vertical-controls">
        <Toggle checked={true} onChange={() => {}} />
        <Input
          value="You are a helpful assistant."
          onChange={() => {}}
        />
      </div>
    )
  }
}