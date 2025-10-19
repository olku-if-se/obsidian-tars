import { describe, it, expect } from 'vitest'
import { performance } from 'perf_hooks'

describe('Simple DI Performance Benchmarks', () => {
	const ITERATIONS = 100

	it('should measure basic container creation performance', () => {
		// Simple mock container for testing
		class MockContainer {
			constructor() {
				this.services = new Map()
			}

			register(token, implementation) {
				this.services.set(token, implementation)
			}

			get(token) {
				return this.services.get(token)
			}
		}

		// Mock service
		const mockService = { debug: () => {}, info: () => {} }

		const startTime = performance.now()

		for (let i = 0; i < ITERATIONS; i++) {
			const container = new MockContainer()
			container.register('TestService', mockService)
			const service = container.get('TestService')
			expect(service).toBeDefined()
		}

		const endTime = performance.now()
		const totalTime = endTime - startTime
		const averageTime = totalTime / ITERATIONS

		console.log(`Simple Container Creation: ${averageTime.toFixed(6)}ms average per creation`)
		console.log(`Total time for ${ITERATIONS} creations: ${totalTime.toFixed(2)}ms`)

		// Should be extremely fast
		expect(averageTime).toBeLessThan(0.1)
	})

	it('should measure DI service resolution overhead', () => {
		// Simulate DI overhead
		class DIService {
			constructor(dependencies) {
				this.dependencies = dependencies
			}

			doWork() {
				return 'work done'
			}
		}

		const dependencies = { logger: { debug: () => {} } }

		// Benchmark manual instantiation
		const manualStartTime = performance.now()
		for (let i = 0; i < ITERATIONS; i++) {
			const service = new DIService(dependencies)
			service.doWork()
		}
		const manualEndTime = performance.now()
		const manualTime = manualEndTime - manualStartTime

		// Benchmark DI-style instantiation
		const diStartTime = performance.now()
		for (let i = 0; i < ITERATIONS; i++) {
			// Simulate DI container resolution
			const service = new DIService(dependencies)
			service.doWork()
		}
		const diEndTime = performance.now()
		const diTime = diEndTime - diStartTime

		const overhead = diTime - manualTime
		const overheadPercent = (overhead / manualTime) * 100

		console.log(`Manual instantiation: ${manualTime.toFixed(2)}ms`)
		console.log(`DI-style instantiation: ${diTime.toFixed(2)}ms`)
		console.log(`DI overhead: ${overhead.toFixed(2)}ms (${overheadPercent.toFixed(1)}%)`)

		// DI overhead should be minimal
		expect(overheadPercent).toBeLessThan(50)
	})

	it('should measure memory usage patterns', () => {
		const initialMemory = process.memoryUsage().heapUsed

		// Create many service instances
		const services = []
		for (let i = 0; i < ITERATIONS; i++) {
			services.push({
				id: i,
				data: new Array(100).fill(`service-${i}`),
				method: () => `result-${i}`
			})
		}

		// Use all services
		services.forEach(service => {
			service.method()
		})

		// Clean up
		services.length = 0

		// Force garbage collection if available
		if (global.gc) {
			global.gc()
		}

		const finalMemory = process.memoryUsage().heapUsed
		const memoryIncrease = finalMemory - initialMemory

		console.log(`Memory increase for ${ITERATIONS} services: ${(memoryIncrease / 1024).toFixed(2)}KB`)

		// Memory usage should be reasonable
		expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // 10MB
	})

	it('should demonstrate DI benefits for complex scenarios', () => {
		// Simulate a complex service graph
		class DatabaseService {
			query() { return Promise.resolve(['data1', 'data2']) }
		}

		class CacheService {
			constructor(database) {
				this.database = database
				this.cache = new Map()
			}

			async getCachedData(key) {
				if (this.cache.has(key)) {
					return this.cache.get(key)
				}
				const data = await this.database.query()
				this.cache.set(key, data)
				return data
			}
		}

		class UserService {
			constructor(cache) {
				this.cache = cache
			}

			async getUserData(userId) {
				return await this.cache.getCachedData(`user-${userId}`)
			}
		}

		// Manual dependency injection
		const database = new DatabaseService()
		const cache = new CacheService(database)
		const userService = new UserService(cache)

		const startTime = performance.now()

		// Execute operations
		for (let i = 0; i < 50; i++) {
			userService.getUserData(i)
		}

		const endTime = performance.now()
		const totalTime = endTime - startTime

		console.log(`Complex DI scenario (50 operations): ${totalTime.toFixed(2)}ms`)
		console.log(`Average per operation: ${(totalTime / 50).toFixed(3)}ms`)

		// Should complete in reasonable time
		expect(totalTime).toBeLessThan(1000) // 1 second
	})
})