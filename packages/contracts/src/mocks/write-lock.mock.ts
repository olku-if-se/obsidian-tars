import type { DocumentWriteLock } from "../services";

export class NoopDocumentWriteLock implements DocumentWriteLock {
	async runExclusive<T>(fn: () => T | Promise<T>): Promise<T> {
		return await fn();
	}

	isLocked(): boolean {
		return false;
	}

	tryAcquire(): boolean {
		return true;
	}

	release(): void {}
}
