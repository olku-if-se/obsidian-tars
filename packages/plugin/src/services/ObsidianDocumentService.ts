import { injectable } from '@needle-di/core'
import { App, TFile, TFolder, normalizePath } from 'obsidian'
import {
	IDocumentService,
	EmbedCache
} from '@tars/contracts'
import { DocumentWriteLock } from '../utils/documentWriteLock'

@injectable()
export class ObsidianDocumentService implements IDocumentService {
	private app: App
	private writeLock: DocumentWriteLock

	constructor(app: App) {
		this.app = app
		this.writeLock = new DocumentWriteLock()
	}

	getCurrentDocumentPath(): string {
		const activeFile = this.app.workspace.getActiveFile()
		return activeFile ? activeFile.path : ''
	}

	async resolveEmbedAsBinary(embed: EmbedCache): Promise<ArrayBuffer> {
		const link = embed.link

		// Handle internal file links
		if (link.startsWith('[[') && link.endsWith(']]')) {
			const filePath = link.slice(2, -2)
			const file = this.app.metadataCache.getFirstLinkpathDest(filePath, this.getCurrentDocumentPath())

			if (file instanceof TFile) {
				const binary = await this.app.vault.readBinary(file)
				return binary.buffer
			}
		}

		// Handle HTTP URLs
		if (link.startsWith('http://') || link.startsWith('https://')) {
			try {
				const response = await fetch(link)
				if (!response.ok) {
					throw new Error(`Failed to fetch embed: ${response.statusText}`)
				}
				return await response.arrayBuffer()
			} catch (error) {
				throw new Error(`Failed to resolve embed: ${error}`)
			}
		}

		throw new Error(`Unsupported embed format: ${link}`)
	}

	async createPlainText(filePath: string, text: string): Promise<void> {
		const normalizedPath = normalizePath(filePath)
		const existingFile = this.app.vault.getAbstractFileByPath(normalizedPath)

		if (existingFile instanceof TFile) {
			await this.app.vault.modify(existingFile, text)
		} else {
			await this.app.vault.create(normalizedPath, text)
		}
	}

	getDocumentWriteLock(): DocumentWriteLock {
		return this.writeLock
	}

	normalizePath(path: string): string {
		return normalizePath(path)
	}

	getFileBasename(): string {
		const activeFile = this.app.workspace.getActiveFile()
		if (!activeFile) return ''
		return activeFile.basename
	}

	getFileExtension(): string {
		const activeFile = this.app.workspace.getActiveFile()
		if (!activeFile) return ''
		return activeFile.extension
	}

	getFolderPath(): string {
		const activeFile = this.app.workspace.getActiveFile()
		if (!activeFile) return ''
		return activeFile.parent?.path || ''
	}

	fileExists(path: string): boolean {
		const file = this.app.vault.getAbstractFileByPath(normalizePath(path))
		return file !== null
	}

	async readFile(path: string): Promise<string> {
		const normalizedPath = normalizePath(path)
		const file = this.app.vault.getAbstractFileByPath(normalizedPath)

		if (file instanceof TFile) {
			return await this.app.vault.read(file)
		}

		throw new Error(`File not found: ${path}`)
	}

	async writeFile(path: string, content: string): Promise<void> {
		const normalizedPath = normalizePath(path)
		const existingFile = this.app.vault.getAbstractFileByPath(normalizedPath)

		if (existingFile instanceof TFile) {
			await this.app.vault.modify(existingFile, content)
		} else {
			await this.app.vault.create(normalizedPath, content)
		}
	}

	getFolderFiles(folderPath: string, extension?: string): string[] {
		const normalizedPath = normalizePath(folderPath)
		const folder = this.app.vault.getAbstractFileByPath(normalizedPath)

		if (!(folder instanceof TFolder)) {
			return []
		}

		const files: string[] = []

		const collectFiles = (currentFolder: TFolder) => {
			for (const child of currentFolder.children) {
				if (child instanceof TFile) {
					if (!extension || child.extension === extension) {
						files.push(child.path)
					}
				} else if (child instanceof TFolder) {
					collectFiles(child)
				}
			}
		}

		collectFiles(folder)
		return files
	}
}