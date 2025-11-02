import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DIError, ErrorSeverity, errorHandler } from '../../src/di/error-handler'
import { CircularDependencyDetector, circularDependencyDetector } from '../../src/di/circular-dependency-detector'
import { DIMode, diDebug } from '../../src/di/debug-mode'

describe('Dependency Resolution Error Handling', () => {
  beforeEach(() => {
    // Reset error handler and debug mode before each test
    errorHandler.clearHistory()
    diDebug.clearLogs()
    circularDependencyDetector.clear()
    diDebug.configure({ enabled: true, logLevel: 'trace' })
  })

  afterEach(() => {
    // Clean up after each test
    errorHandler.clearHistory()
    diDebug.clearLogs()
    circularDependencyDetector.clear()
  })

  describe('DIError Class', () => {
    it('should create a basic DI error', () => {
      const error = new DIError(
        'Test error message',
        'TEST_ERROR',
        ErrorSeverity.MEDIUM,
        { token: 'TestToken' }
      )

      expect(error.message).toBe('Test error message')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.severity).toBe(ErrorSeverity.MEDIUM)
      expect(error.context.token).toBe('TestToken')
      expect(error.timestamp).toBeTypeOf('number')
      expect(error.name).toBe('DIError')
    })

    it('should format error message correctly', () => {
      const error = new DIError(
        'Test error',
        'TEST_ERROR',
        ErrorSeverity.HIGH,
        {
          token: 'TestToken',
          operation: 'test_operation',
          duration: 150,
          dependencies: ['dep1', 'dep2']
        }
      )

      const formatted = error.toFormattedString()
      expect(formatted).toContain('[HIGH] TEST_ERROR: Test error')
      expect(formatted).toContain('Token: TestToken')
      expect(formatted).toContain('Operation: test_operation')
      expect(formatted).toContain('Duration: 150ms')
      expect(formatted).toContain('Dependencies: dep1, dep2')
    })

    it('should provide user-friendly error messages', () => {
      const tokenError = new DIError(
        'Token "TestToken" is not registered',
        'TOKEN_NOT_REGISTERED',
        ErrorSeverity.HIGH,
        { token: 'TestToken' }
      )

      expect(tokenError.toUserFriendlyString()).toBe('A required component is missing: TestToken')

      const circularError = new DIError(
        'Circular dependency detected: A -> B -> C -> A',
        'CIRCULAR_DEPENDENCY',
        ErrorSeverity.CRITICAL
      )

      expect(circularError.toUserFriendlyString()).toBe('Circular dependency detected between components')
    })

    it('should check error relationships to tokens', () => {
      const error = new DIError(
        'Error with dependency',
        'DEPENDENCY_ERROR',
        ErrorSeverity.HIGH,
        {
          token: 'ServiceA',
          dependencies: ['ServiceB', 'ServiceC']
        }
      )

      expect(error.isRelatedToToken('ServiceA')).toBe(true)
      expect(error.isRelatedToToken('ServiceB')).toBe(true)
      expect(error.isRelatedToToken('ServiceC')).toBe(true)
      expect(error.isRelatedToToken('ServiceD')).toBe(false)
    })

    it('should identify critical errors', () => {
      const criticalError = new DIError(
        'Critical error',
        'CRITICAL_ERROR',
        ErrorSeverity.CRITICAL
      )

      const mediumError = new DIError(
        'Medium error',
        'MEDIUM_ERROR',
        ErrorSeverity.MEDIUM
      )

      expect(criticalError.isCritical()).toBe(true)
      expect(mediumError.isCritical()).toBe(false)
    })
  })

  describe('DIErrorHandler', () => {
    it('should create and track errors', () => {
      const error1 = errorHandler.createError(
        'test_error',
        { token: 'TestToken' },
        ErrorSeverity.MEDIUM
      )

      const error2 = errorHandler.tokenNotRegisteredError('TestToken2')

      expect(error1).toBeInstanceOf(DIError)
      expect(error2).toBeInstanceOf(DIError)

      const history = errorHandler.getErrorHistory()
      expect(history).toHaveLength(2)
      expect(history[0].code).toBe('TEST_ERROR')
      expect(history[1].code).toBe('TOKEN_NOT_REGISTERED')
    })

    it('should handle circular dependency errors', () => {
      const error = errorHandler.circularDependencyError(['A', 'B', 'C', 'A'])

      expect(error.code).toBe('CIRCULAR_DEPENDENCY')
      expect(error.severity).toBe(ErrorSeverity.CRITICAL)
      expect(error.context.dependencies).toEqual(['B', 'C', 'A'])
    })

    it('should handle provider errors', () => {
      const notFoundError = errorHandler.providerNotFoundError('openai')
      const configError = errorHandler.providerConfigurationError('claude', ['Missing API key', 'Invalid model'])

      expect(notFoundError.code).toBe('PROVIDER_NOT_FOUND')
      expect(notFoundError.context.tag).toBe('openai')

      expect(configError.code).toBe('PROVIDER_INVALID_CONFIG')
      expect(configError.context.tag).toBe('claude')
    })

    it('should wrap existing errors', () => {
      const originalError = new Error('Original error message')
      const wrappedError = errorHandler.wrapError(originalError, 'test_operation', 'TestToken')

      expect(wrappedError).toBeInstanceOf(DIError)
      expect(wrappedError.cause).toBe(originalError)
      expect(wrappedError.context.operation).toBe('test_operation')
      expect(wrappedError.context.token).toBe('TestToken')
    })

    it('should filter errors by severity and token', () => {
      // Create errors with different severities
      errorHandler.createError('low_error', {}, ErrorSeverity.LOW)
      errorHandler.createError('high_error', { token: 'TestToken' }, ErrorSeverity.HIGH)
      errorHandler.createError('critical_error', {}, ErrorSeverity.CRITICAL)
      errorHandler.createError('medium_error', { token: 'TestToken' }, ErrorSeverity.MEDIUM)

      const highErrors = errorHandler.getErrorsBySeverity(ErrorSeverity.HIGH)
      const tokenErrors = errorHandler.getErrorsByToken('TestToken')

      expect(highErrors).toHaveLength(1)
      expect(tokenErrors).toHaveLength(2)
    })

    it('should provide error statistics', () => {
      // Create various errors
      errorHandler.createError('error1', {}, ErrorSeverity.LOW)
      errorHandler.createError('error2', {}, ErrorSeverity.HIGH)
      errorHandler.createError('error3', {}, ErrorSeverity.HIGH)
      errorHandler.createError('error1', {}, ErrorSeverity.MEDIUM)

      const stats = errorHandler.getErrorStats()

      expect(stats.total).toBe(4)
      expect(stats.bySeverity[ErrorSeverity.HIGH]).toBe(2)
      expect(stats.bySeverity[ErrorSeverity.LOW]).toBe(1)
      expect(stats.bySeverity[ErrorSeverity.MEDIUM]).toBe(1)
      expect(stats.bySeverity[ErrorSeverity.CRITICAL]).toBe(0)
    })

    it('should generate user-friendly error report', () => {
      // Create some errors
      errorHandler.createError('test_error', {}, ErrorSeverity.HIGH)
      errorHandler.circularDependencyError(['A', 'B', 'A'])

      const report = errorHandler.createUserReport()

      expect(report).toContain('DI System Error Report')
      expect(report).toContain('Total Errors: 2')
      expect(report).toContain('Critical Errors: 1')
    })
  })

  describe('CircularDependencyDetector', () => {
    it('should detect direct circular dependencies', () => {
      circularDependencyDetector.startResolution('ServiceA')
      circularDependencyDetector.addDependency('ServiceA', 'ServiceB')
      circularDependencyDetector.startResolution('ServiceB')
      circularDependencyDetector.addDependency('ServiceB', 'ServiceA')

      expect(() => {
        circularDependencyDetector.checkCircularDependency('ServiceB', 'ServiceA')
      }).toThrow('Circular dependency detected')
    })

    it('should detect indirect circular dependencies', () => {
      // A -> B -> C -> A
      circularDependencyDetector.startResolution('ServiceA')
      circularDependencyDetector.addDependency('ServiceA', 'ServiceB')
      circularDependencyDetector.addDependency('ServiceB', 'ServiceC')
      circularDependencyDetector.addDependency('ServiceC', 'ServiceA')

      circularDependencyDetector.startResolution('ServiceB')
      circularDependencyDetector.startResolution('ServiceC')

      expect(() => {
        circularDependencyDetector.checkCircularDependency('ServiceC', 'ServiceA')
      }).toThrow('Circular dependency detected')
    })

    it('should track resolution depth', () => {
      circularDependencyDetector.startResolution('ServiceA')
      circularDependencyDetector.startResolution('ServiceB')
      circularDependencyDetector.startResolution('ServiceC')

      expect(circularDependencyDetector.getResolutionDepth('ServiceA')).toBe(3)
      expect(circularDependencyDetector.getResolutionDepth('ServiceB')).toBe(2)
      expect(circularDependencyDetector.getResolutionDepth('ServiceC')).toBe(1)

      circularDependencyDetector.endResolution('ServiceC')
      expect(circularDependencyDetector.getResolutionDepth('ServiceA')).toBe(2)
    })

    it('should analyze dependency graph', () => {
      // Create a graph with some structure
      circularDependencyDetector.addDependency('ServiceA', 'ServiceB')
      circularDependencyDetector.addDependency('ServiceA', 'ServiceC')
      circularDependencyDetector.addDependency('ServiceB', 'ServiceD')
      circularDependencyDetector.addDependency('ServiceE', 'ServiceF')

      const analysis = circularDependencyDetector.analyzeDependencyGraph()

      expect(analysis.totalNodes).toBe(6)
      expect(analysis.totalEdges).toBe(4)
      expect(analysis.isolatedNodes).toContain('ServiceE') // No incoming edges
      expect(analysis.isolatedNodes).toContain('ServiceF')
    })

    it('should validate graph correctness', () => {
      // Create a valid graph
      circularDependencyDetector.addDependency('ServiceA', 'ServiceB')
      circularDependencyDetector.addDependency('ServiceB', 'ServiceC')

      let validation = circularDependencyDetector.validateGraph()
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)

      // Add a circular dependency
      circularDependencyDetector.addDependency('ServiceC', 'ServiceA')

      validation = circularDependencyDetector.validateGraph()
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('should provide formatted dependency graph', () => {
      circularDependencyDetector.addDependency('ServiceA', 'ServiceB')
      circularDependencyDetector.addDependency('ServiceA', 'ServiceC')

      const graph = circularDependencyDetector.getFormattedDependencyGraph()

      expect(graph).toContain('Dependency Graph:')
      expect(graph).toContain('ServiceA')
      expect(graph).toContain('depends on → ServiceB')
      expect(graph).toContain('depends on → ServiceC')
    })

    it('should create safe resolvers', () => {
      let resolveCount = 0

      const result = circularDependencyDetector.createSafeResolver('TestService', () => {
        resolveCount++
        return 'test-result'
      })

      expect(result).toBe('test-result')
      expect(resolveCount).toBe(1)

      // Test with dependency tracking
      const result2 = circularDependencyDetector.createSafeResolverWithDependency(
        'ServiceA',
        'ServiceB',
        () => 'result-with-dep'
      )

      expect(result2).toBe('result-with-dep')
    })
  })

  describe('DIMode Debug System', () => {
    it('should configure debug settings', () => {
      const customConfig = {
        enabled: true,
        logLevel: 'debug' as const,
        trackResolutions: true,
        trackPerformance: false,
      }

      diDebug.configure(customConfig)

      const config = diDebug.getConfig()
      expect(config.enabled).toBe(true)
      expect(config.logLevel).toBe('debug')
      expect(config.trackResolutions).toBe(true)
      expect(config.trackPerformance).toBe(false)
    })

    it('should filter log levels correctly', () => {
      diDebug.configure({ logLevel: 'warn' })

      expect(diDebug.isLogLevelEnabled('error')).toBe(true)
      expect(diDebug.isLogLevelEnabled('warn')).toBe(true)
      expect(diDebug.isLogLevelEnabled('info')).toBe(false)
      expect(diDebug.isLogLevelEnabled('debug')).toBe(false)
    })

    it('should track resolutions', () => {
      diDebug.startResolution('TestService')
      // Simulate some work
      const result = diDebug.trackPerformance('test_operation', () => {
        return 'test-result'
      }, 'TestService')
      diDebug.endResolution('TestService', true)

      const stats = diDebug.getResolutionStats()
      expect(stats.total).toBe(1)
      expect(stats.successful).toBe(1)
      expect(stats.failed).toBe(0)
    })

    it('should track failed resolutions', () => {
      diDebug.startResolution('TestService')
      diDebug.endResolution('TestService', false, 'Test error')

      const stats = diDebug.getResolutionStats()
      expect(stats.total).toBe(1)
      expect(stats.successful).toBe(0)
      expect(stats.failed).toBe(1)
    })

    it('should track performance metrics', () => {
      diDebug.trackPerformance('fast_operation', () => {
        // Fast operation
      })

      diDebug.trackPerformance('slow_operation', () => {
        // Simulate slower operation
        const start = Date.now()
        while (Date.now() - start < 10) {
          // Wait 10ms
        }
      })

      const stats = diDebug.getPerformanceStats()
      expect(stats.total).toBe(2)
      expect(stats.averageDuration).toBeGreaterThan(0)
    })

    it('should track dependencies', () => {
      diDebug.startResolution('ServiceA')
      diDebug.trackDependency('ServiceA', 'ServiceB')
      diDebug.trackDependency('ServiceA', 'ServiceC')
      diDebug.endResolution('ServiceA', true)

      const recent = diDebug.getRecentLogs(10, 'resolution')
      expect(recent.resolutions).toHaveLength(1)
      expect(recent.resolutions[0].dependencies).toEqual(['ServiceB', 'ServiceC'])
    })

    it('should create debug contexts', () => {
      const context = diDebug.createDebugContext('test_operation', 'TestToken')

      expect(typeof context.log).toBe('function')
      expect(typeof context.trackPerformance).toBe('function')
      expect(typeof context.trackDependency).toBe('function')

      // Test the context
      context.log('info', 'Test message', { data: 'test' })
      const result = context.trackPerformance(() => 'context-result')
      expect(result).toBe('context-result')
    })

    it('should generate comprehensive debug report', () => {
      // Add some activity
      diDebug.startResolution('ServiceA')
      diDebug.endResolution('ServiceA', true)
      diDebug.trackPerformance('test_operation', () => 'test')
      circularDependencyDetector.addDependency('ServiceA', 'ServiceB')

      const report = diDebug.generateDebugReport()

      expect(report).toContain('DI System Debug Report')
      expect(report).toContain('Resolution Statistics:')
      expect(report).toContain('Performance Statistics:')
      expect(report).toContain('Dependency Graph:')
    })

    it('should export debug data', () => {
      diDebug.startResolution('TestService')
      diDebug.endResolution('TestService', true)
      diDebug.trackPerformance('test_op', () => 'test')

      const data = diDebug.exportData()

      expect(data.config).toBeDefined()
      expect(data.resolutions).toHaveLength(1)
      expect(data.performance).toHaveLength(1)
      expect(data.timestamp).toBeTypeOf('number')
    })

    it('should validate configuration errors', () => {
      const errors = [
        { message: 'Invalid configuration value', path: 'test.path' },
        { message: 'Missing required field', path: 'test.required' },
      ]

      diDebug.validateConfiguration(errors)

      const recent = diDebug.getRecentLogs(1, 'both')
      expect(recent.resolutions.length + recent.performance.length).toBeGreaterThan(0)
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complex dependency resolution with errors', () => {
      // Setup a complex scenario
      const detector = CircularDependencyDetector.getInstance()
      const debug = DIMode.getInstance()

      debug.configure({ enabled: true, logLevel: 'debug' })

      // Start tracking a service that will fail
      debug.startResolution('ProblematicService')

      // Add some dependencies
      detector.addDependency('ProblematicService', 'DependencyA')
      detector.addDependency('ProblematicService', 'DependencyB')

      // Track performance
      const timerId = debug.startPerformanceTimer('complex_resolution', 'ProblematicService')

      // Simulate a failure
      const error = errorHandler.serviceInstantiationError('ProblematicService', new Error('Service unavailable'))

      debug.endResolution('ProblematicService', false, error.message)
      debug.endPerformanceTimer(timerId, false, { error: error.message })

      // Verify everything was tracked
      const resolutionStats = debug.getResolutionStats()
      const performanceStats = debug.getPerformanceStats()

      expect(resolutionStats.failed).toBe(1)
      expect(performanceStats.total).toBe(1)
      expect(errorHandler.getErrorHistory()).toHaveLength(1)
    })

    it('should detect and report circular dependencies gracefully', () => {
      const detector = CircularDependencyDetector.getInstance()
      const debug = DIMode.getInstance()

      // Create a circular dependency
      detector.addDependency('ServiceA', 'ServiceB')
      detector.addDependency('ServiceB', 'ServiceC')
      detector.addDependency('ServiceC', 'ServiceA')

      // Try to resolve and catch the error
      let caughtError: DIError | null = null

      try {
        detector.checkCircularDependency('ServiceC', 'ServiceA')
      } catch (error) {
        caughtError = error as DIError
      }

      expect(caughtError).toBeInstanceOf(DIError)
      expect(caughtError?.code).toBe('CIRCULAR_DEPENDENCY')
      expect(caughtError?.severity).toBe(ErrorSeverity.CRITICAL)

      // Verify it was tracked in error handler
      const errors = errorHandler.getErrorHistory()
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should maintain performance under load', () => {
      const debug = DIMode.getInstance()
      const detector = CircularDependencyDetector.getInstance()

      debug.configure({ trackPerformance: true, trackResolutions: true })

      const startTime = Date.now()

      // Simulate high activity
      for (let i = 0; i < 100; i++) {
        const serviceName = `Service${i}`

        debug.startResolution(serviceName)
        detector.addDependency(serviceName, `Dependency${i}`)

        const result = debug.trackPerformance('batch_operation', () => {
          // Simulate work
          return `result-${i}`
        }, serviceName)

        debug.endResolution(serviceName, true)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000) // 1 second max

      const resolutionStats = debug.getResolutionStats()
      const performanceStats = debug.getPerformanceStats()

      expect(resolutionStats.total).toBe(100)
      expect(resolutionStats.successful).toBe(100)
      expect(performanceStats.total).toBe(100)
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle error history overflow gracefully', () => {
      const maxHistory = 50
      diDebug.configure({ maxLogEntries: maxHistory })

      // Create more errors than the max history size
      for (let i = 0; i < maxHistory + 20; i++) {
        errorHandler.createError(`error_${i}`, {}, ErrorSeverity.LOW)
      }

      const history = errorHandler.getErrorHistory()
      expect(history.length).toBeLessThanOrEqual(maxHistory)
      expect(history[history.length - 1].code).toBe('ERROR_' + (maxHistory + 19))
    })

    it('should provide context for debugging', () => {
      const context = diDebug.createDebugContext('debug_test', 'TestService')

      // Log different levels
      context.log('error', 'Error message')
      context.log('warn', 'Warning message')
      context.log('info', 'Info message')

      // Track performance
      const result = context.trackPerformance(() => 'test_result')

      // Track dependency
      context.trackDependency('DependencyService')

      expect(result).toBe('test_result')

      // Verify logs were created with proper context
      const recent = diDebug.getRecentLogs(1, 'both')
      expect(recent.resolutions.length + recent.performance.length).toBeGreaterThan(0)
    })

    it('should maintain consistency across multiple error scenarios', () => {
      // Test multiple error types
      const errors = [
        errorHandler.tokenNotRegisteredError('MissingToken'),
        errorHandler.providerNotFoundError('MissingProvider'),
        errorHandler.circularDependencyError(['A', 'B', 'A']),
        errorHandler.serviceInstantiationError('FaultyService', new Error('Service failed')),
      ]

      // Verify all errors were created correctly
      expect(errors).toHaveLength(4)
      expect(errors[0].code).toBe('TOKEN_NOT_REGISTERED')
      expect(errors[1].code).toBe('PROVIDER_NOT_FOUND')
      expect(errors[2].code).toBe('CIRCULAR_DEPENDENCY')
      expect(errors[3].code).toBe('SERVICE_INSTANTIATION_FAILED')

      // Verify error statistics
      const stats = errorHandler.getErrorStats()
      expect(stats.total).toBe(4)
      expect(stats.bySeverity[ErrorSeverity.HIGH]).toBe(3)
      expect(stats.bySeverity[ErrorSeverity.CRITICAL]).toBe(1)
    })
  })
})