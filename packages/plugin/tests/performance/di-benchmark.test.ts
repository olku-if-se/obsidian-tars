import { describe, it, expect, beforeEach } from 'vitest'
import { performance } from 'perf_hooks'
import { createPluginContainer, createTestContainer } from '../../src/container/plugin-container'

describe('DI Performance Benchmarks', () => {
	const ITERATIONS = 1000

	describe('Container Creation Performance', () => {
		it('should create test container quickly', () => {
			const startTime = performance.now()

			for (let i = 0; i < ITERATIONS; i++) {
				const container = createTestContainer()
				expect(container).toBeDefined()
			}

			const endTime = performance.now()
			const totalTime = endTime - startTime
			const averageTime = totalTime / ITERATIONS

			console.log(`Container Creation: ${averageTime.toFixed(3)}ms average per creation`)
			console.log(`Total time for ${ITERATIONS} creations: ${totalTime.toFixed(2)}ms`)

			// Should be very fast - less than 1ms per creation
			expect(averageTime).toBeLessThan(1)
		})

		it('should create plugin container efficiently', () => {
			const mockOptions = {
				app: {},
				plugin: {},
				settings: {},
				statusBarManager: {}
			}

			const startTime = performance.now()

			for (let i = 0; i < 100; i++) { // Fewer iterations for more complex container
				const container = createPluginContainer(mockOptions)
				expect(container).toBeDefined()
			}

			const endTime = performance.now()
			const totalTime = endTime - startTime
			const averageTime = totalTime / 100

			console.log(`Plugin Container Creation: ${averageTime.toFixed(3)}ms average per creation`)
			console.log(`Total time for 100 creations: ${totalTime.toFixed(2)}ms`)

			// Should be reasonable - less than 10ms per creation
			expect(averageTime).toBeLessThan(10)
		})
	})

	describe('Service Resolution Performance', () => {
		let container: ReturnType<typeof createTestContainer>

		beforeEach(() => {
			container = createTestContainer()
		})

		it('should resolve services quickly', async () => {
			const { ILoggingService } = await import('@tars/contracts')

			const startTime = performance.now()

			for (let i = 0; i < ITERATIONS; i++) {
				const service = container.get(ILoggingService)
				expect(service).toBeDefined()
			}

			const endTime = performance.now()
			const totalTime = endTime - startTime
			const averageTime = totalTime / ITERATIONS

			console.log(`Service Resolution: ${averageTime.toFixed(6)}ms average per resolution`)
			console.log(`Total time for ${ITERATIONS} resolutions: ${totalTime.toFixed(2)}ms`)

			// Should be extremely fast - less than 0.01ms per resolution
			expect(averageTime).toBeLessThan(0.01)
		})

		it('should resolve multiple services efficiently', async () => {
			const {
				ILoggingService,
				INotificationService,
				ISettingsService,
				IStatusService,
				IDocumentService
			} = await import('@tars/contracts')

			const services = [
				ILoggingService,
				INotificationService,
				ISettingsService,
				IStatusService,
				IDocumentService
			]

			const startTime = performance.now()

			for (let i = 0; i < ITERATIONS; i++) {
				for (const Service of services) {
					const service = container.get(Service)
					expect(service).toBeDefined()
				}
			}

			const endTime = performance.now()
			const totalTime = endTime - startTime
			const averageTime = totalTime / (ITERATIONS * services.length)

			console.log(`Multi-Service Resolution: ${averageTime.toFixed(6)}ms average per resolution`)
			console.log(`Total time for ${ITERATIONS * services.length} resolutions: ${totalTime.toFixed(2)}ms`)

			// Should still be very fast
			expect(averageTime).toBeLessThan(0.005)
		})
	})

	describe('Memory Usage', () => {
		it('should not leak memory during repeated operations', async () => {
			const { ILoggingService } = await import('@tars/contracts')

			// Measure initial memory
			const initialMemory = process.memoryUsage().heapUsed

			// Perform many container operations
			for (let i = 0; i < ITERATIONS; i++) {
				const container = createTestContainer()
				const service = container.get(ILoggingService)
				expect(service).toBeDefined()
			}

			// Force garbage collection if available
			if (global.gc) {
				global.gc()
			}

			// Measure final memory
			const finalMemory = process.memoryUsage().heapUsed
			const memoryIncrease = finalMemory - initialMemory

			console.log(`Memory increase after ${ITERATIONS} operations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)

			// Memory increase should be reasonable (less than 10MB)
			expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // 10MB
		})
	})

	describe('DI vs Manual Instantiation Comparison', () => {
		it('should compare DI overhead with manual instantiation', async () => {
			const { ILoggingService } = await import('@tars/contracts')

			// Manual instantiation mock
			const manualLogger = {
				debug: vi.fn(),
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn()
			}

			// Benchmark manual instantiation
			const manualStartTime = performance.now()
			for (let i = 0; i < ITERATIONS; i++) {
				const logger = manualLogger // Simulate manual "instantiation"
				logger.debug('test')
			}
			const manualEndTime = performance.now()
			const manualTime = manualEndTime - manualStartTime

			// Benchmark DI resolution
			const container = createTestContainer()
			const diStartTime = performance.now()
			for (let i = 0; i < ITERATIONS; i++) {
				const logger = container.get(ILoggingService)
				logger.debug('test')
			}
			const diEndTime = performance.now()
			const diTime = diEndTime - diStartTime

			const overhead = diTime - manualTime
			const overheadPercent = (overhead / manualTime) * 100

			console.log(`Manual instantiation: ${manualTime.toFixed(2)}ms`)
			console.log(`DI resolution: ${diTime.toFixed(2)}ms`)
			console.log(`DI overhead: ${overhead.toFixed(2)}ms (${overheadPercent.toFixed(1)}%)`)

			// DI overhead should be minimal - less than 20%
			expect(overheadPercent).toBeLessThan(20)
		})
	})
})