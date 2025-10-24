// Additional utility types and type guards

/**
 * Type guard for checking if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Type guard for checking if a value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Type guard for checking if a value is an array
 */
export function isArray<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.every(guard)
}

/**
 * Helper type for making all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Helper type for making all properties required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

/**
 * Helper type for picking nested properties
 */
export type NestedPath<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedPath<T[K]>}`
          : K
        : never
    }[keyof T]
  : never

/**
 * Helper type for getting nested property value
 */
export type NestedValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? NestedValue<T[K], Rest>
    : never
  : P extends keyof T
  ? T[P]
  : never

/**
 * Common union types
 */
export type StringOrNumber = string | number
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type AsyncFunction<T = unknown> = (...args: unknown[]) => Promise<T>
export type SyncFunction<T = unknown> = (...args: unknown[]) => T

/**
 * Brand types for type safety
 */
export type BrandedString<T extends string> = string & { readonly __brand: T }
export type BrandedNumber<T extends string> = number & { readonly __brand: T }

/**
 * Create a branded string
 */
export function createBrand<T extends string>(value: string): BrandedString<T> {
  return value as BrandedString<T>
}

/**
 * Type guard for branded types
 */
export function isBranded<T extends string>(
  value: unknown,
  brand: T
): value is BrandedString<T> {
  return typeof value === 'string'
}