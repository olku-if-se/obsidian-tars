import type { EmbedCache } from "../providers";
import type { DocumentWriteLock, IDocumentService } from "../services";
import { NoopDocumentWriteLock } from "./write-lock.mock";

export class MockDocumentService implements IDocumentService {
	getCurrentDocumentPath(): string {
		return "";
	}

	async resolveEmbedAsBinary(_embed: EmbedCache): Promise<ArrayBuffer> {
		return new ArrayBuffer(0);
	}

	async createPlainText(_filePath: string, _text: string): Promise<void> {}

	getDocumentWriteLock(): DocumentWriteLock {
		return new NoopDocumentWriteLock();
	}

	normalizePath(path: string): string {
		return path;
	}

	getFileBasename(): string {
		return "";
	}

	getFileExtension(): string {
		return "";
	}

	getFolderPath(): string {
		return "";
	}

	fileExists(_path: string): boolean {
		return false;
	}

	async readFile(_path: string): Promise<string> {
		return "";
	}

	async writeFile(_path: string, _content: string): Promise<void> {}

	getFolderFiles(_folderPath: string, _extension?: string): string[] {
		return [];
	}
}

export const DocumentServiceNoOp: IDocumentService = new MockDocumentService();
