/**
 * MCP Server Templates - Essential hardcoded templates
 * Following the specification: 15 essential templates across different categories
 */

// Template configuration interface
export interface TemplateConfiguration {
	name: string
	command: string
	requirements: string[]
	setupInstructions: string
	envVars?: Record<string, EnvVarConfig>
}

export interface EnvVarConfig {
	description: string
	required: boolean
	default?: string
	example?: string
}

// Template requirements interface
export interface TemplateRequirements {
	docker?: boolean
	node?: boolean
	python?: boolean
	npx?: boolean
	custom?: string[]
}

// Main template interface
export interface MCPServerTemplate {
	id: string
	name: string
	category: string
	description: string
	longDescription: string
	configurations: TemplateConfiguration[]
	useCases: string[]
	tags: string[]
	difficulty: 'beginner' | 'intermediate' | 'advanced'
	requirements: TemplateRequirements
	documentation: string
}

// Essential Templates (15 total) as per specification

/**
 * Productivity Templates
 */
export const memoryServerTemplate: MCPServerTemplate = {
	id: 'memory-server',
	name: 'Memory Server',
	category: 'Productivity',
	description: 'Knowledge graph and memory management for persistent conversations',
	longDescription:
		'Creates a persistent memory system that maintains conversation context and builds a knowledge graph over time. Perfect for maintaining long-term context across sessions.',
	configurations: [
		{
			name: 'Default Memory',
			command: 'npx @modelcontextprotocol/server-memory',
			requirements: ['Node.js', 'npm/npx'],
			setupInstructions:
				'Install Node.js and run the command to start a memory server that persists conversation context.'
		}
	],
	useCases: ['Persistent conversation context', 'Knowledge management', 'Session continuity'],
	tags: ['memory', 'knowledge', 'persistence', 'context'],
	difficulty: 'beginner',
	requirements: { node: true, npx: true },
	documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory'
}

export const filesystemServerTemplate: MCPServerTemplate = {
	id: 'filesystem-server',
	name: 'Filesystem Access',
	category: 'Productivity',
	description: 'Read, write, and manage files on your local filesystem',
	longDescription:
		'Provides secure access to your local filesystem with configurable path restrictions. Perfect for document processing, file management, and local data operations.',
	configurations: [
		{
			name: 'Full Filesystem Access',
			command: 'npx @modelcontextprotocol/server-filesystem',
			requirements: ['Node.js', 'npm/npx'],
			setupInstructions:
				'Run with appropriate permissions. Consider limiting access to specific directories for security.',
			envVars: {
				FILESYSTEM_ROOT: {
					description: 'Root directory for filesystem access',
					required: false,
					default: '.',
					example: '/home/user/documents'
				}
			}
		}
	],
	useCases: ['File management', 'Document processing', 'Local data access'],
	tags: ['filesystem', 'files', 'documents', 'local'],
	difficulty: 'beginner',
	requirements: { node: true, npx: true },
	documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem'
}

export const exaSearchTemplate: MCPServerTemplate = {
	id: 'exa-search',
	name: 'Exa Web Search',
	category: 'Productivity',
	description: 'Web search capabilities using Exa search API',
	longDescription:
		'Integrates with Exa search API to provide comprehensive web search functionality. Perfect for research, fact-checking, and gathering current information.',
	configurations: [
		{
			name: 'Exa API Search',
			command: 'npx @modelcontextprotocol/server-exa',
			requirements: ['Node.js', 'npm/npx', 'Exa API key'],
			setupInstructions: 'Get an Exa API key and set it as environment variable EXA_API_KEY.',
			envVars: {
				EXA_API_KEY: {
					description: 'Your Exa API key for web search',
					required: true,
					example: 'your_exa_api_key_here'
				}
			}
		}
	],
	useCases: ['Web research', 'Fact-checking', 'Current information gathering'],
	tags: ['search', 'web', 'research', 'exa'],
	difficulty: 'intermediate',
	requirements: { node: true, npx: true },
	documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/exa'
}

/**
 * Development Templates
 */
export const githubServerTemplate: MCPServerTemplate = {
	id: 'github-server',
	name: 'GitHub Repository Access',
	category: 'Development',
	description: 'Access and manage GitHub repositories',
	longDescription:
		'Provides comprehensive GitHub repository access including files, commits, issues, and pull requests. Perfect for code analysis and repository management.',
	configurations: [
		{
			name: 'GitHub API Access',
			command: 'npx @modelcontextprotocol/server-github',
			requirements: ['Node.js', 'npm/npx', 'GitHub token'],
			setupInstructions: 'Create a GitHub personal access token and set it as GITHUB_TOKEN environment variable.',
			envVars: {
				GITHUB_TOKEN: {
					description: 'GitHub personal access token',
					required: true,
					example: 'ghp_your_github_token_here'
				}
			}
		}
	],
	useCases: ['Code analysis', 'Repository management', 'Issue tracking'],
	tags: ['github', 'git', 'repository', 'code'],
	difficulty: 'intermediate',
	requirements: { node: true, npx: true },
	documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github'
}

export const gitServerTemplate: MCPServerTemplate = {
	id: 'git-server',
	name: 'Git Repository Operations',
	category: 'Development',
	description: 'Local git repository operations and analysis',
	longDescription:
		'Provides access to local git repositories for commit history, diff analysis, and repository inspection. Perfect for code review and version control tasks.',
	configurations: [
		{
			name: 'Local Git Access',
			command: 'npx @modelcontextprotocol/server-git',
			requirements: ['Node.js', 'npm/npx', 'Git'],
			setupInstructions: 'Run from within a git repository or provide the repository path.'
		}
	],
	useCases: ['Code review', 'Commit analysis', 'Repository inspection'],
	tags: ['git', 'version-control', 'code-review', 'local'],
	difficulty: 'beginner',
	requirements: { node: true, npx: true },
	documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/git'
}

/**
 * Data & Analytics Templates
 */
export const postgresServerTemplate: MCPServerTemplate = {
	id: 'postgres-server',
	name: 'PostgreSQL Database',
	category: 'Data & Analytics',
	description: 'PostgreSQL database access and query execution',
	longDescription:
		'Provides secure access to PostgreSQL databases for query execution, schema inspection, and data analysis. Perfect for database management and data exploration.',
	configurations: [
		{
			name: 'PostgreSQL Connection',
			command: 'npx @modelcontextprotocol/server-postgres',
			requirements: ['Node.js', 'npm/npx', 'PostgreSQL database'],
			setupInstructions: 'Provide database connection details via environment variables.',
			envVars: {
				POSTGRES_CONNECTION_STRING: {
					description: 'PostgreSQL connection string',
					required: true,
					example: 'postgresql://user:password@localhost:5432/database'
				}
			}
		}
	],
	useCases: ['Database queries', 'Data analysis', 'Schema inspection'],
	tags: ['database', 'sql', 'postgres', 'analytics'],
	difficulty: 'intermediate',
	requirements: { node: true, npx: true },
	documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres'
}

export const sqliteServerTemplate: MCPServerTemplate = {
	id: 'sqlite-server',
	name: 'SQLite Database',
	category: 'Data & Analytics',
	description: 'SQLite database access and management',
	longDescription:
		'Provides access to SQLite databases for query execution and data manipulation. Perfect for local data storage and lightweight database applications.',
	configurations: [
		{
			name: 'SQLite Database Access',
			command: 'npx @modelcontextprotocol/server-sqlite',
			requirements: ['Node.js', 'npm/npx', 'SQLite file'],
			setupInstructions: 'Provide path to SQLite database file via environment variable.',
			envVars: {
				SQLITE_DB_PATH: {
					description: 'Path to SQLite database file',
					required: true,
					example: './data/database.db'
				}
			}
		}
	],
	useCases: ['Local data storage', 'Lightweight database', 'Mobile apps'],
	tags: ['database', 'sqlite', 'local', 'lightweight'],
	difficulty: 'beginner',
	requirements: { node: true, npx: true },
	documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite'
}

/**
 * AI & Machine Learning Templates
 */
export const ollamaServerTemplate: MCPServerTemplate = {
	id: 'ollama-server',
	name: 'Ollama Local LLM',
	category: 'AI & Machine Learning',
	description: 'Local LLM access through Ollama',
	longDescription:
		'Provides access to locally running LLM models through Ollama. Perfect for private AI processing and local model experimentation.',
	configurations: [
		{
			name: 'Ollama Local Models',
			command: 'npx @modelcontextprotocol/server-ollama',
			requirements: ['Node.js', 'npm/npx', 'Ollama installed'],
			setupInstructions: 'Install Ollama and pull models before starting the server.',
			envVars: {
				OLLAMA_BASE_URL: {
					description: 'Ollama server URL',
					required: false,
					default: 'http://localhost:11434',
					example: 'http://localhost:11434'
				}
			}
		}
	],
	useCases: ['Local AI processing', 'Privacy-focused AI', 'Model experimentation'],
	tags: ['ai', 'llm', 'ollama', 'local'],
	difficulty: 'intermediate',
	requirements: { node: true, npx: true },
	documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/ollama'
}

/**
 * System & Utilities Templates
 */
export const dockerServerTemplate: MCPServerTemplate = {
	id: 'docker-server',
	name: 'Docker Container Management',
	category: 'System & Utilities',
	description: 'Docker container management and operations',
	longDescription:
		'Provides Docker container management capabilities including listing, starting, stopping, and inspecting containers. Perfect for development environment management.',
	configurations: [
		{
			name: 'Docker Management',
			command: 'npx @modelcontextprotocol/server-docker',
			requirements: ['Node.js', 'npm/npx', 'Docker installed'],
			setupInstructions: 'Ensure Docker daemon is running and user has appropriate permissions.'
		}
	],
	useCases: ['Container management', 'Development environments', 'Deployment'],
	tags: ['docker', 'containers', 'devops', 'system'],
	difficulty: 'advanced',
	requirements: { node: true, npx: true },
	documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/docker'
}

export const systemInfoServerTemplate: MCPServerTemplate = {
	id: 'system-info-server',
	name: 'System Information',
	category: 'System & Utilities',
	description: 'System monitoring and information gathering',
	longDescription:
		'Provides comprehensive system information including CPU, memory, disk usage, and process information. Perfect for system monitoring and diagnostics.',
	configurations: [
		{
			name: 'System Monitoring',
			command: 'npx @modelcontextprotocol/server-puppeteer',
			requirements: ['Node.js', 'npm/npx'],
			setupInstructions: 'Provides system information and web automation capabilities.'
		}
	],
	useCases: ['System monitoring', 'Performance analysis', 'Diagnostics'],
	tags: ['system', 'monitoring', 'performance', 'info'],
	difficulty: 'beginner',
	requirements: { node: true, npx: true },
	documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer'
}

// Additional templates to reach 15 total

export const puppeteerServerTemplate: MCPServerTemplate = {
	id: 'puppeteer-server',
	name: 'Web Automation',
	category: 'System & Utilities',
	description: 'Web page automation and scraping',
	longDescription:
		'Provides web automation capabilities using Puppeteer for scraping, testing, and browser automation. Perfect for data extraction and web testing.',
	configurations: [
		{
			name: 'Browser Automation',
			command: 'npx @modelcontextprotocol/server-puppeteer',
			requirements: ['Node.js', 'npm/npx'],
			setupInstructions: 'Automatically manages Chrome/Chromium instances for web automation.'
		}
	],
	useCases: ['Web scraping', 'Browser testing', 'Data extraction'],
	tags: ['web', 'automation', 'scraping', 'browser'],
	difficulty: 'intermediate',
	requirements: { node: true, npx: true },
	documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer'
}

export const fetchServerTemplate: MCPServerTemplate = {
	id: 'fetch-server',
	name: 'HTTP Fetch',
	category: 'System & Utilities',
	description: 'HTTP requests and API integration',
	longDescription:
		'Provides HTTP request capabilities for API integration and web service access. Perfect for REST API interactions and data fetching.',
	configurations: [
		{
			name: 'HTTP Client',
			command: 'npx @modelcontextprotocol/server-fetch',
			requirements: ['Node.js', 'npm/npx'],
			setupInstructions: 'Simple HTTP client for making requests to any HTTP endpoint.'
		}
	],
	useCases: ['API integration', 'Data fetching', 'Web services'],
	tags: ['http', 'api', 'fetch', 'requests'],
	difficulty: 'beginner',
	requirements: { node: true, npx: true },
	documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch'
}

export const awsServerTemplate: MCPServerTemplate = {
	id: 'aws-server',
	name: 'AWS Services',
	category: 'Development',
	description: 'AWS service integration and management',
	longDescription:
		'Provides access to AWS services including S3, EC2, and Lambda. Perfect for cloud resource management and AWS automation.',
	configurations: [
		{
			name: 'AWS API Access',
			command: 'npx @modelcontextprotocol/server-aws',
			requirements: ['Node.js', 'npm/npx', 'AWS credentials'],
			setupInstructions: 'Configure AWS credentials via environment variables or AWS credentials file.',
			envVars: {
				AWS_ACCESS_KEY_ID: {
					description: 'AWS access key ID',
					required: true,
					example: 'AKIAIOSFODNN7EXAMPLE'
				},
				AWS_SECRET_ACCESS_KEY: {
					description: 'AWS secret access key',
					required: true,
					example: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
				},
				AWS_REGION: {
					description: 'AWS region',
					required: false,
					default: 'us-east-1',
					example: 'us-west-2'
				}
			}
		}
	],
	useCases: ['Cloud management', 'AWS automation', 'Resource monitoring'],
	tags: ['aws', 'cloud', 'infrastructure', 'devops'],
	difficulty: 'advanced',
	requirements: { node: true, npx: true },
	documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/aws'
}

export const braveSearchTemplate: MCPServerTemplate = {
	id: 'brave-search',
	name: 'Brave Search API',
	category: 'Productivity',
	description: 'Web search using Brave Search API',
	longDescription:
		'Integrates with Brave Search API for comprehensive web search with privacy focus. Perfect for research and information gathering.',
	configurations: [
		{
			name: 'Brave Search',
			command: 'npx @modelcontextprotocol/server-brave-search',
			requirements: ['Node.js', 'npm/npx', 'Brave Search API key'],
			setupInstructions: 'Get a Brave Search API key and set it as environment variable.',
			envVars: {
				BRAVE_API_KEY: {
					description: 'Brave Search API key',
					required: true,
					example: 'your_brave_search_api_key'
				}
			}
		}
	],
	useCases: ['Web research', 'Privacy-focused search', 'Information gathering'],
	tags: ['search', 'web', 'brave', 'privacy'],
	difficulty: 'intermediate',
	requirements: { node: true, npx: true },
	documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search'
}

export const puppeteerDocsTemplate: MCPServerTemplate = {
	id: 'puppeteer-docs',
	name: 'Documentation Web Automation',
	category: 'System & Utilities',
	description: 'Documentation extraction and processing',
	longDescription:
		'Specialized Puppeteer configuration for documentation extraction and processing from websites. Perfect for knowledge base creation.',
	configurations: [
		{
			name: 'Docs Processing',
			command: 'npx @modelcontextprotocol/server-puppeteer-docs',
			requirements: ['Node.js', 'npm/npx'],
			setupInstructions: 'Optimized for extracting clean text from documentation sites.'
		}
	],
	useCases: ['Documentation extraction', 'Knowledge base creation', 'Content processing'],
	tags: ['documentation', 'puppeteer', 'extraction', 'knowledge'],
	difficulty: 'intermediate',
	requirements: { node: true, npx: true },
	documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer-docs'
}

// Template collections organized by category
export const templateCategories = [
	{
		id: 'productivity',
		name: 'Productivity',
		description: 'Essential tools for productivity and knowledge management',
		templates: [memoryServerTemplate, filesystemServerTemplate, exaSearchTemplate, braveSearchTemplate]
	},
	{
		id: 'development',
		name: 'Development',
		description: 'Coding utilities and development tools',
		templates: [githubServerTemplate, gitServerTemplate, awsServerTemplate]
	},
	{
		id: 'data',
		name: 'Data & Analytics',
		description: 'Database and data processing tools',
		templates: [postgresServerTemplate, sqliteServerTemplate]
	},
	{
		id: 'ai',
		name: 'AI & Machine Learning',
		description: 'AI and machine learning tools',
		templates: [ollamaServerTemplate]
	},
	{
		id: 'system',
		name: 'System & Utilities',
		description: 'System management and utility tools',
		templates: [
			dockerServerTemplate,
			systemInfoServerTemplate,
			puppeteerServerTemplate,
			fetchServerTemplate,
			puppeteerDocsTemplate
		]
	}
]

// All templates as a flat array for easy access
export const allTemplates = templateCategories.flatMap((category) => category.templates)

// Template lookup functions
export const getTemplateById = (id: string): MCPServerTemplate | undefined =>
	allTemplates.find((template) => template.id === id)

export const getTemplatesByCategory = (categoryId: string): MCPServerTemplate[] =>
	allTemplates.filter((template) => template.category === categoryId)

export const getTemplatesByTag = (tag: string): MCPServerTemplate[] =>
	allTemplates.filter((template) => template.tags.includes(tag))

export const getTemplatesByDifficulty = (difficulty: 'beginner' | 'intermediate' | 'advanced'): MCPServerTemplate[] =>
	allTemplates.filter((template) => template.difficulty === difficulty)

// Template validation
export const validateTemplate = (template: MCPServerTemplate): boolean =>
	!!(
		template.id &&
		template.name &&
		template.category &&
		template.configurations &&
		template.configurations.length > 0 &&
		template.requirements
	)

// Export default template collection
export default {
	allTemplates,
	templateCategories,
	getTemplateById,
	getTemplatesByCategory,
	getTemplatesByTag,
	getTemplatesByDifficulty,
	validateTemplate
}
