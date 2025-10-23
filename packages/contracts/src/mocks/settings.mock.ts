import type { ISettingsService } from "../services";

export class SettingsServiceMock implements ISettingsService {
	private store = new Map<string, unknown>();
	private watchers = new Map<string, Set<(value: unknown) => void>>();

	async initialize(): Promise<void> {}

	get<T>(key: string, defaultValue?: T): T {
		if (this.store.has(key)) {
			return this.store.get(key) as T;
		}
		return defaultValue as T;
	}

	async set(key: string, value: unknown): Promise<void> {
		this.store.set(key, value);
		this.notify(key, value);
	}

	watch(key: string, callback: (value: unknown) => void): () => void {
		const callbacks =
			this.watchers.get(key) ?? new Set<(value: unknown) => void>();
		callbacks.add(callback);
		this.watchers.set(key, callbacks);
		return () => {
			callbacks.delete(callback);
			if (callbacks.size === 0) {
				this.watchers.delete(key);
			}
		};
	}

	getAll(): Record<string, unknown> {
		return Object.fromEntries(this.store.entries());
	}

	async setAll(settings: Record<string, unknown>): Promise<void> {
		this.store = new Map(Object.entries(settings));
		for (const [key, value] of this.store.entries()) {
			this.notify(key, value);
		}
	}

	has(key: string): boolean {
		return this.store.has(key);
	}

	async remove(key: string): Promise<void> {
		this.store.delete(key);
		this.notify(key, undefined);
	}

	async clear(): Promise<void> {
		const keys = Array.from(this.store.keys());
		this.store.clear();
		for (const key of keys) {
			this.notify(key, undefined);
		}
	}

	private notify(key: string, value: unknown): void {
		const callbacks = this.watchers.get(key);
		if (!callbacks) return;
		for (const cb of callbacks) {
			cb(value);
		}
	}
}

export const SettingsServiceNoOp: ISettingsService = {
	get: <T>(_key: string, defaultValue?: T): T => defaultValue as T,
	set: async () => {},
	has: () => false,
	watch: () => () => {},
	remove: async () => {},
	clear: async () => {},
	getAll: () => ({}),
	setAll: async () => {},
	initialize: async () => {},
};
