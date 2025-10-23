import type { INotificationService } from "../services";

export class MockNotificationService implements INotificationService {
	show(_message: string): void {}

	warn(_message: string): void {}

	error(_message: string): void {}
}

export const NotificationsNoOp: MockNotificationService =
	new MockNotificationService();
