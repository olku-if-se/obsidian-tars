import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../src/components/Input';

const meta = {
	title: 'Components/Input',
	component: Input,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		placeholder: 'Enter text...',
	},
};

export const WithLabel: Story = {
	args: {
		label: 'Username',
		placeholder: 'Enter your username',
	},
};

export const WithError: Story = {
	args: {
		label: 'Email',
		placeholder: 'Enter your email',
		error: 'Please enter a valid email address',
	},
};

export const Small: Story = {
	args: {
		label: 'Small Input',
		placeholder: 'Small input',
		size: 'sm',
	},
};

export const Large: Story = {
	args: {
		label: 'Large Input',
		placeholder: 'Large input',
		size: 'lg',
	},
};

export const Disabled: Story = {
	args: {
		label: 'Disabled Input',
		placeholder: 'Disabled input',
		disabled: true,
	},
};

export const WithValue: Story = {
	args: {
		label: 'Input with value',
		defaultValue: 'Some default text',
	},
};
