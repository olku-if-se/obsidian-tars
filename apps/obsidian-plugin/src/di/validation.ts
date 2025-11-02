import type { PluginSettings } from '../settings'
import type {
  ConfigValidator,
  ContainerConfig,
  DependencyGraph,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from './interfaces'
import { Tokens } from './tokens'

// Error messages
const Errors = {
  validation_failed: 'Configuration validation failed',
  config_invalid: 'Container configuration is invalid',
  dependency_invalid: 'Dependency configuration is invalid',
  circular_dependency: 'Circular dependency detected',
  missing_dependency: 'Required dependency is missing',
} as const

// Custom exceptions
export class ValidationErrorImpl extends Error {
  static failed = (errors: ValidationError[], cause?: unknown) =>
    Object.assign(new ValidationErrorImpl(`${Errors.validation_failed}: ${errors.length} errors found`), {
      code: 'VALIDATION_FAILED',
      errors,
      cause,
    })
}

// Validation rule interface
interface ValidationRule<T> {
  name: string
  validate: (value: T) => ValidationError[]
  optional?: boolean
}

// Container configuration validator
export class ContainerConfigValidator implements ConfigValidator {
  private rules: ValidationRule<ContainerConfig>[] = [
    {
      name: 'debug_mode_boolean',
      validate: config => {
        const errors: ValidationError[] = []
        if (config.debug !== undefined && typeof config.debug !== 'boolean') {
          errors.push({
            path: 'debug',
            message: 'debug must be a boolean value',
            code: 'INVALID_TYPE',
          })
        }
        return errors
      },
    },
    {
      name: 'validate_on_startup_boolean',
      validate: config => {
        const errors: ValidationError[] = []
        if (config.validateOnStartup !== undefined && typeof config.validateOnStartup !== 'boolean') {
          errors.push({
            path: 'validateOnStartup',
            message: 'validateOnStartup must be a boolean value',
            code: 'INVALID_TYPE',
          })
        }
        return errors
      },
    },
    {
      name: 'performance_monitoring_boolean',
      validate: config => {
        const errors: ValidationError[] = []
        if (
          config.enablePerformanceMonitoring !== undefined &&
          typeof config.enablePerformanceMonitoring !== 'boolean'
        ) {
          errors.push({
            path: 'enablePerformanceMonitoring',
            message: 'enablePerformanceMonitoring must be a boolean value',
            code: 'INVALID_TYPE',
          })
        }
        return errors
      },
    },
  ]

  validateConfig(config: ContainerConfig): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Apply all validation rules
    for (const rule of this.rules) {
      try {
        const ruleErrors = rule.validate(config)
        errors.push(...ruleErrors)
      } catch (error) {
        errors.push({
          path: 'validation_rule',
          message: `Validation rule '${rule.name}' failed: ${error}`,
          code: 'RULE_EXECUTION_FAILED',
        })
      }
    }

    // Add warnings for development vs production configurations
    if (config.debug && process.env.NODE_ENV === 'production') {
      warnings.push({
        path: 'debug',
        message: 'Debug mode is enabled in production environment',
        code: 'DEBUG_IN_PRODUCTION',
      })
    }

    if (!config.validateOnStartup && process.env.NODE_ENV === 'production') {
      warnings.push({
        path: 'validateOnStartup',
        message: 'Startup validation is disabled in production environment',
        code: 'NO_VALIDATION_IN_PRODUCTION',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  validateDependencies(container: { get: (token: unknown) => unknown } | null): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    try {
      // Check if container has required core tokens
      const requiredTokens = [Tokens.ObsidianApp, Tokens.AppSettings]

      for (const token of requiredTokens) {
        if (!this.isTokenRegistered(container, token)) {
          errors.push({
            path: 'tokens',
            message: `Required token '${token.toString()}' is not registered`,
            code: 'MISSING_REQUIRED_TOKEN',
          })
        }
      }

      // Validate service dependencies (placeholder for future implementation)
      warnings.push({
        path: 'services',
        message: 'Service dependency validation not yet implemented',
        code: 'VALIDATION_NOT_IMPLEMENTED',
      })
    } catch (error) {
      errors.push({
        path: 'container',
        message: `Failed to validate container dependencies: ${error}`,
        code: 'CONTAINER_VALIDATION_FAILED',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  validateCircularDependencies(container: { get: (token: unknown) => unknown } | null): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    try {
      // Build dependency graph
      const dependencyGraph = this.buildDependencyGraph(container)

      // Check for circular dependencies
      const cycles = this.detectCycles(dependencyGraph)

      if (cycles.length > 0) {
        for (const cycle of cycles) {
          errors.push({
            path: 'dependencies',
            message: `Circular dependency detected: ${cycle.join(' -> ')}`,
            code: 'CIRCULAR_DEPENDENCY',
          })
        }
      }
    } catch (error) {
      errors.push({
        path: 'circular_dependency_check',
        message: `Failed to check for circular dependencies: ${error}`,
        code: 'CIRCULAR_DEPENDENCY_CHECK_FAILED',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  private isTokenRegistered(_container: { get: (token: unknown) => unknown } | null, _token: unknown): boolean {
    // Placeholder implementation - would check actual container
    return true // Assuming all tokens are registered for now
  }

  private buildDependencyGraph(_container: { get: (token: unknown) => unknown } | null): DependencyGraph {
    // Placeholder implementation - would analyze actual container dependencies
    return {
      nodes: [],
      edges: [],
    }
  }

  private detectCycles(_graph: DependencyGraph): string[][] {
    // Placeholder implementation - would use graph algorithms to detect cycles
    return []
  }
}

// Plugin settings validator
export class SettingsValidator {
  private rules: ValidationRule<PluginSettings>[] = [
    {
      name: 'tags_structure',
      validate: settings => {
        const errors: ValidationError[] = []

        if (!settings.userTags || !Array.isArray(settings.userTags) || settings.userTags.length === 0) {
          errors.push({
            path: 'userTags',
            message: 'userTags configuration is required and must be a non-empty array',
            code: 'MISSING_USER_TAGS',
          })
        }

        if (!settings.systemTags || !Array.isArray(settings.systemTags) || settings.systemTags.length === 0) {
          errors.push({
            path: 'systemTags',
            message: 'systemTags configuration is required and must be a non-empty array',
            code: 'MISSING_SYSTEM_TAGS',
          })
        }

        return errors
      },
    },
    {
      name: 'providers_structure',
      validate: settings => {
        const errors: ValidationError[] = []

        if (!settings.providers) {
          errors.push({
            path: 'providers',
            message: 'providers configuration is required',
            code: 'MISSING_PROVIDERS',
          })
          return errors
        }

        if (typeof settings.providers !== 'object') {
          errors.push({
            path: 'providers',
            message: 'providers must be an object',
            code: 'INVALID_PROVIDERS_TYPE',
          })
        }

        return errors
      },
    },
    {
      name: 'enable_status_bar_boolean',
      validate: settings => {
        const errors: ValidationError[] = []

        if (settings.enableTagSuggest !== undefined && typeof settings.enableTagSuggest !== 'boolean') {
          errors.push({
            path: 'enableTagSuggest',
            message: 'enableTagSuggest must be a boolean value',
            code: 'INVALID_TYPE',
          })
        }

        return errors
      },
    },
  ]

  validate(settings: PluginSettings): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Apply all validation rules
    for (const rule of this.rules) {
      if (!rule.optional || settings !== undefined) {
        try {
          const ruleErrors = rule.validate(settings)
          errors.push(...ruleErrors)
        } catch (error) {
          errors.push({
            path: 'validation_rule',
            message: `Validation rule '${rule.name}' failed: ${error}`,
            code: 'RULE_EXECUTION_FAILED',
          })
        }
      }
    }

    // Add contextual warnings
    if (settings.providers && Object.keys(settings.providers).length === 0) {
      warnings.push({
        path: 'providers',
        message: 'No AI providers configured',
        code: 'NO_PROVIDERS_CONFIGURED',
      })
    }

    if (settings.userTags || settings.systemTags) {
      const tagRegex = /^#[\w-]+:$/
      if (settings.userTags) {
        settings.userTags.forEach((tag, index) => {
          if (!tagRegex.test(tag)) {
            warnings.push({
              path: `userTags[${index}]`,
              message: 'User tag should follow format #TagName:',
              code: 'INVALID_TAG_FORMAT',
            })
          }
        })
      }

      if (settings.systemTags) {
        settings.systemTags.forEach((tag, index) => {
          if (!tagRegex.test(tag)) {
            warnings.push({
              path: `systemTags[${index}]`,
              message: 'System tag should follow format #TagName:',
              code: 'INVALID_TAG_FORMAT',
            })
          }
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  validateProvider(providerName: string, providerConfig: Record<string, unknown> | null): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!providerConfig) {
      errors.push({
        path: `providers.${providerName}`,
        message: `Provider configuration for '${providerName}' is missing`,
        code: 'MISSING_PROVIDER_CONFIG',
      })
      return { isValid: false, errors, warnings }
    }

    // biome-ignore lint/suspicious/noExplicitAny: Provider config structure varies by provider and is best handled as any for validation
    const config = providerConfig as any

    // Validate API key presence
    if (!config.apiKey || typeof config.apiKey !== 'string') {
      errors.push({
        path: `providers.${providerName}.apiKey`,
        message: `API key is required for provider '${providerName}'`,
        code: 'MISSING_API_KEY',
      })
    }

    // Validate base URL (optional)
    if (config.baseURL && typeof config.baseURL !== 'string') {
      errors.push({
        path: `providers.${providerName}.baseURL`,
        message: `Base URL must be a string for provider '${providerName}'`,
        code: 'INVALID_BASE_URL',
      })
    }

    // Validate model (optional)
    if (config.model && typeof config.model !== 'string') {
      errors.push({
        path: `providers.${providerName}.model`,
        message: `Model must be a string for provider '${providerName}'`,
        code: 'INVALID_MODEL',
      })
    }

    // Add warning if API key appears to be default/placeholder
    if (config.apiKey && typeof config.apiKey === 'string' && config.apiKey.length < 10) {
      warnings.push({
        path: `providers.${providerName}.apiKey`,
        message: `API key for '${providerName}' appears to be a placeholder`,
        code: 'PLACEHOLDER_API_KEY',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }
}

// Validation utility functions
export const ValidationUtils = {
  isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },

  isValidApiKey(key: string): boolean {
    // Basic validation - check if it's not empty and has reasonable length
    return typeof key === 'string' && key.trim().length > 0
  },

  isValidTagFormat(tag: string): boolean {
    // Tags should follow format #TagName:
    return /^#[\w-]+:$/.test(tag)
  },

  mergeValidationResults(...results: ValidationResult[]): ValidationResult {
    const allErrors: ValidationError[] = []
    const allWarnings: ValidationWarning[] = []

    for (const result of results) {
      allErrors.push(...result.errors)
      allWarnings.push(...result.warnings)
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    }
  },

  formatValidationErrors(errors: ValidationError[]): string {
    return errors.map(error => `${error.path}: ${error.message}`).join('\n')
  },

  formatValidationWarnings(warnings: ValidationWarning[]): string {
    return warnings.map(warning => `${warning.path}: ${warning.message}`).join('\n')
  },
}

// Default validator instances
export const containerConfigValidator = new ContainerConfigValidator()
export const settingsValidator = new SettingsValidator()
