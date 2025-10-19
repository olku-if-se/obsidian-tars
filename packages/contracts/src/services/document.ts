import type { EmbedCache } from '../providers/base'

/**
 * Document service interface for handling Obsidian document operations
 */
export interface IDocumentService {
	/**
	 * Get the current active document path
	 */
	getCurrentDocumentPath(): string

	/**
	 * Resolve an embed reference to binary data
	 */
	resolveEmbedAsBinary(embed: EmbedCache): Promise<ArrayBuffer>

	/**
	 * Create a plain text file
	 */
	createPlainText(filePath: string, text: string): Promise<void>

	/**
	 * Get a document write lock for thread-safe operations
	 */
	getDocumentWriteLock(): DocumentWriteLock

	/**
	 * Normalize a file path according to platform conventions
	 */
	normalizePath?(path: string): string

	/**
	 * Get the current file's basename (without extension)
	 */
	getFileBasename(): string

	/**
	 * Get the current file's extension
	 */
	getFileExtension(): string

	/**
	 * Get the current file's folder path
	 */
	getFolderPath(): string

	/**
	 * Check if a file exists
	 */
	fileExists(path: string): boolean

	/**
	 * Read file content as text
	 */
	readFile(path: string): Promise<string>

	/**
	 * Write content to a file
	 */
	writeFile(path: string, content: string): Promise<void>

	/**
	 * Get all files in a folder with optional filtering
	 */
	getFolderFiles(folderPath: string, extension?: string): string[]
}

/**
 * Document write lock interface for thread-safe document editing
 */
export interface DocumentWriteLock {
	/**
	 * Run an operation exclusively on the document
	 */
	runExclusive<T>(fn: () => T | Promise<T>): Promise<T>

	/**
	 * Check if the lock is currently held
	 */
	isLocked(): boolean

	/**
	 * Try to acquire the lock without waiting
	 */
	tryAcquire(): boolean

	/**
	 * Release the lock if held
	 */
	release(): void
}
