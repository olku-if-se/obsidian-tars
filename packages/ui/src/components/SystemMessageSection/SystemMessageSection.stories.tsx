import type { Meta, StoryObj } from '@storybook/react-vite'
import { SystemMessageSection } from './SystemMessageSection'

const meta = {
	title: 'Settings/SystemMessageSection',
	component: SystemMessageSection,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof SystemMessageSection>

export default meta
type Story = StoryObj<typeof meta>

export const EnabledWithMessage: Story = {
	args: {
		enableDefaultSystemMsg: true,
		defaultSystemMsg: 'You are a helpful assistant that provides accurate, concise, and well-structured responses.',
		onToggleEnable: (enabled: boolean) => console.log('toggle-enable', enabled),
		onMessageChange: (message: string) => console.log('message-change', message),
		onToggleSection: (open: boolean) => console.log('toggle-section', open)
	}
}

export const Disabled: Story = {
	args: {
		enableDefaultSystemMsg: false,
		defaultSystemMsg: 'You are a helpful assistant.',
		onToggleEnable: (enabled: boolean) => console.log('toggle-enable', enabled),
		onMessageChange: (message: string) => console.log('message-change', message),
		onToggleSection: (open: boolean) => console.log('toggle-section', open)
	}
}

export const CustomSystemMessage: Story = {
	args: {
		enableDefaultSystemMsg: true,
		defaultSystemMsg: `You are an expert software engineer with 10+ years of experience in full-stack development.

Your expertise includes:
- React, TypeScript, and Node.js
- System architecture and design patterns
- Best practices for code quality and testing
- Performance optimization

Always provide practical, well-explained solutions with code examples when appropriate.`,
		onToggleEnable: (enabled: boolean) => console.log('toggle-enable', enabled),
		onMessageChange: (message: string) => console.log('message-change', message),
		onToggleSection: (open: boolean) => console.log('toggle-section', open)
	}
}

export const MinimalMessage: Story = {
	args: {
		enableDefaultSystemMsg: true,
		defaultSystemMsg: 'Be helpful and concise.',
		onToggleEnable: (enabled: boolean) => console.log('toggle-enable', enabled),
		onMessageChange: (message: string) => console.log('message-change', message),
		onToggleSection: (open: boolean) => console.log('toggle-section', open)
	}
}

export const TechnicalAssistant: Story = {
	args: {
		enableDefaultSystemMsg: true,
		defaultSystemMsg: `You are a technical documentation assistant. Your role is to:

1. Provide clear, accurate technical explanations
2. Include code examples when helpful
3. Suggest best practices and common patterns
4. Reference official documentation when possible
5. Highlight potential issues or considerations

Focus on being educational and practical in your responses.`,
		onToggleEnable: (enabled: boolean) => console.log('toggle-enable', enabled),
		onMessageChange: (message: string) => console.log('message-change', message),
		onToggleSection: (open: boolean) => console.log('toggle-section', open)
	}
}

export const CreativeWriting: Story = {
	args: {
		enableDefaultSystemMsg: true,
		defaultSystemMsg: `You are a creative writing assistant and storyteller. Your characteristics:

- Rich, descriptive language that brings ideas to life
- Strong narrative instincts and plot development skills
- Ability to write in various genres and styles
- Collaborative approach that builds on user ideas
- Attention to character development and emotional depth

Help users craft compelling stories, poems, and creative content.`,
		onToggleEnable: (enabled: boolean) => console.log('toggle-enable', enabled),
		onMessageChange: (message: string) => console.log('message-change', message),
		onToggleSection: (open: boolean) => console.log('toggle-section', open)
	}
}

export const CodeReviewer: Story = {
	args: {
		enableDefaultSystemMsg: true,
		defaultSystemMsg: `You are a senior code reviewer. When analyzing code, always:

1. **Security First**: Identify potential vulnerabilities and security issues
2. **Performance**: Point out performance bottlenecks and optimization opportunities
3. **Maintainability**: Assess code clarity, structure, and long-term maintainability
4. **Best Practices**: Compare against industry standards and language-specific conventions
5. **Testing**: Identify missing test coverage and suggest test strategies

Provide specific, actionable feedback with code examples when suggesting improvements.`,
		onToggleEnable: (enabled: boolean) => console.log('toggle-enable', enabled),
		onMessageChange: (message: string) => console.log('message-change', message),
		onToggleSection: (open: boolean) => console.log('toggle-section', open)
	}
}

export const InitiallyExpanded: Story = {
	args: {
		enableDefaultSystemMsg: true,
		defaultSystemMsg: 'You are a helpful AI assistant specialized in providing accurate and useful information.',
		defaultOpen: true,
		onToggleEnable: (enabled: boolean) => console.log('toggle-enable', enabled),
		onMessageChange: (message: string) => console.log('message-change', message),
		onToggleSection: (open: boolean) => console.log('toggle-section', open)
	}
}

export const EmptyMessage: Story = {
	args: {
		enableDefaultSystemMsg: true,
		defaultSystemMsg: '',
		onToggleEnable: (enabled: boolean) => console.log('toggle-enable', enabled),
		onMessageChange: (message: string) => console.log('message-change', message),
		onToggleSection: (open: boolean) => console.log('toggle-section', open)
	}
}

export const LongMessage: Story = {
	args: {
		enableDefaultSystemMsg: true,
		defaultSystemMsg: `You are an advanced AI assistant with comprehensive knowledge across multiple domains. Your core principles:

**Communication Style**
- Always be clear, accurate, and thoughtful
- Provide structured responses with headings and bullet points when appropriate
- Ask clarifying questions when the user's request is ambiguous
- Admit when you don't know something rather than speculating

**Technical Expertise**
- Software development (full-stack, mobile, DevOps)
- System architecture and design patterns
- Data science and machine learning
- Cloud platforms and infrastructure

**Problem-Solving Approach**
- Break down complex problems into manageable steps
- Consider multiple perspectives and trade-offs
- Provide practical, implementable solutions
- Include relevant examples and code snippets

**Ethical Guidelines**
- Prioritize user safety and privacy
- Avoid harmful or malicious content
- Respect intellectual property and copyright
- Promote inclusive and respectful communication

Always strive to be helpful while maintaining high standards of accuracy and integrity.`,
		onToggleEnable: (enabled: boolean) => console.log('toggle-enable', enabled),
		onMessageChange: (message: string) => console.log('message-change', message),
		onToggleSection: (open: boolean) => console.log('toggle-section', open)
	}
}
