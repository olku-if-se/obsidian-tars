/**
 * Connection state enum
 * Used across packages for MCP and provider communication
 */
export enum ConnectionState {
	DISCONNECTED = 'disconnected',
	CONNECTING = 'connecting',
	CONNECTED = 'connected',
	ERROR = 'error'
}
