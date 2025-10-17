import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { SettingsProvider, useMCPServers } from './SettingsProvider'

const wrapper = ({ children }: { children: ReactNode }) => (
	<SettingsProvider>{children}</SettingsProvider>
)

describe('SettingsProvider MCP server helpers', () => {
	it('adds blank servers with default metadata', () => {
		const { result } = renderHook(() => useMCPServers(), { wrapper })

		act(() => {
			result.current.addServer()
		})

		expect(result.current.servers).toHaveLength(1)
		const [server] = result.current.servers
		expect(server.name).toBe('New MCP Server')
		expect(server.displayMode).toBe('url')
		expect(server.validationState.isValid).toBe(false)
	})

	it('applies templates and enforces unique server names', () => {
		const { result } = renderHook(() => useMCPServers(), { wrapper })

		act(() => {
			result.current.addServer({
				name: 'Filesystem Access',
				displayMode: 'url',
				configInput: 'https://example.com',
				enabled: true
			})
		})

		act(() => {
			result.current.addServer({
				name: 'Filesystem Access',
				displayMode: 'url',
				configInput: 'https://example.com',
				enabled: true
			})
		})

		expect(result.current.servers).toHaveLength(2)
		expect(result.current.servers[0].name).toBe('Filesystem Access')
		expect(result.current.servers[1].name).toBe('Filesystem Access 2')
		expect(result.current.servers[0].validationState.isValid).toBe(true)
		expect(result.current.servers[1].validationState.isValid).toBe(true)
	})
})
