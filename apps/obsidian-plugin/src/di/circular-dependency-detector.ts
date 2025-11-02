import { DIError, ErrorSeverity } from './error-handler'

/**
 * Circular dependency detection for DI container
 *
 * This class tracks the dependency resolution chain and detects
 * circular dependencies before they cause stack overflow errors.
 */
export class CircularDependencyDetector {
  private static instance: CircularDependencyDetector
  private resolutionStacks: Map<string, string[]> = new Map()
  private dependencyGraph: Map<string, Set<string>> = new Map()
  private detectionEnabled = true

  private constructor() {}

  static getInstance(): CircularDependencyDetector {
    if (!CircularDependencyDetector.instance) {
      CircularDependencyDetector.instance = new CircularDependencyDetector()
    }
    return CircularDependencyDetector.instance
  }

  /**
   * Enable or disable circular dependency detection
   */
  setDetectionEnabled(enabled: boolean): void {
    this.detectionEnabled = enabled
  }

  /**
   * Check if detection is enabled
   */
  isDetectionEnabled(): boolean {
    return this.detectionEnabled
  }

  /**
   * Start tracking dependency resolution for a token
   */
  startResolution(token: string): void {
    if (!this.detectionEnabled) {
      return
    }

    // Initialize stack if not exists
    if (!this.resolutionStacks.has(token)) {
      this.resolutionStacks.set(token, [])
    }

    const stack = this.resolutionStacks.get(token)!
    stack.push(token)
  }

  /**
   * End tracking dependency resolution for a token
   */
  endResolution(token: string): void {
    if (!this.detectionEnabled) {
      return
    }

    const stack = this.resolutionStacks.get(token)
    if (stack) {
      stack.pop()
      if (stack.length === 0) {
        this.resolutionStacks.delete(token)
      }
    }
  }

  /**
   * Add a dependency relationship
   */
  addDependency(from: string, to: string): void {
    if (!this.detectionEnabled) {
      return
    }

    if (!this.dependencyGraph.has(from)) {
      this.dependencyGraph.set(from, new Set())
    }
    this.dependencyGraph.get(from)!.add(to)
  }

  /**
   * Check for circular dependency before resolving a dependency
   */
  checkCircularDependency(token: string, dependency: string): void {
    if (!this.detectionEnabled) {
      return
    }

    // Get current resolution stack
    const stack = this.resolutionStacks.get(token)
    if (!stack) {
      return
    }

    // Check if dependency is already in the stack
    const dependencyIndex = stack.indexOf(dependency)
    if (dependencyIndex !== -1) {
      // Found circular dependency
      const circularPath = stack.slice(dependencyIndex).concat([dependency])
      throw this.createCircularDependencyError(circularPath)
    }

    // Check dependency graph for indirect cycles
    this.checkIndirectCircularDependency(token, dependency, new Set())
  }

  /**
   * Check for indirect circular dependencies using DFS
   */
  private checkIndirectCircularDependency(
    startToken: string,
    targetToken: string,
    visited: Set<string>
  ): void {
    if (visited.has(targetToken)) {
      return
    }
    visited.add(targetToken)

    const dependencies = this.dependencyGraph.get(targetToken)
    if (!dependencies) {
      return
    }

    // Get current resolution stack
    const stack = this.resolutionStacks.get(startToken) || []

    for (const dep of dependencies) {
      if (stack.includes(dep)) {
        // Found indirect circular dependency
        const dependencyIndex = stack.indexOf(dep)
        const circularPath = stack.slice(dependencyIndex).concat([dep, targetToken])
        throw this.createCircularDependencyError(circularPath)
      }

      // Recursively check deeper dependencies
      this.checkIndirectCircularDependency(startToken, dep, new Set(visited))
    }
  }

  /**
   * Create a circular dependency error
   */
  private createCircularDependencyError(path: string[]): DIError {
    const pathString = path.join(' -> ')
    return new DIError(
      `Circular dependency detected: ${pathString}`,
      'SERVICE_DEPENDENCY_CIRCULAR',
      ErrorSeverity.CRITICAL,
      {
        token: path[0],
        dependencies: path.slice(1),
        operation: 'dependency_resolution'
      }
    )
  }

  /**
   * Get the current resolution depth for a token
   */
  getResolutionDepth(token: string): number {
    const stack = this.resolutionStacks.get(token)
    return stack ? stack.length : 0
  }

  /**
   * Get all current resolution stacks
   */
  getAllResolutionStacks(): Map<string, string[]> {
    return new Map(this.resolutionStacks)
  }

  /**
   * Get the dependency graph
   */
  getDependencyGraph(): Map<string, Set<string>> {
    return new Map(this.dependencyGraph)
  }

  /**
   * Clear all tracking data
   */
  clear(): void {
    this.resolutionStacks.clear()
    this.dependencyGraph.clear()
  }

  /**
   * Analyze the dependency graph for potential issues
   */
  analyzeDependencyGraph(): {
    totalNodes: number
    totalEdges: number
    circularDependencies: string[][]
    maxDepth: number
    deepestPath: string[]
    isolatedNodes: string[]
  } {
    const totalNodes = this.dependencyGraph.size
    let totalEdges = 0
    let maxDepth = 0
    let deepestPath: string[] = []

    // Count edges and find deepest path
    for (const [node, dependencies] of this.dependencyGraph) {
      totalEdges += dependencies.size
      if (dependencies.size > maxDepth) {
        maxDepth = dependencies.size
        deepestPath = [node, ...Array.from(dependencies)]
      }
    }

    // Find isolated nodes (nodes with no dependencies and no dependents)
    const isolatedNodes: string[] = []
    const hasIncoming = new Set<string>()

    for (const dependencies of this.dependencyGraph.values()) {
      for (const dep of dependencies) {
        hasIncoming.add(dep)
      }
    }

    for (const node of this.dependencyGraph.keys()) {
      if (!hasIncoming.has(node) && this.dependencyGraph.get(node)!.size === 0) {
        isolatedNodes.push(node)
      }
    }

    // Find circular dependencies
    const circularDependencies = this.findCircularDependencies()

    return {
      totalNodes,
      totalEdges,
      circularDependencies,
      maxDepth,
      deepestPath,
      isolatedNodes,
    }
  }

  /**
   * Find all circular dependencies in the graph
   */
  private findCircularDependencies(): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node)
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart).concat([node]))
        }
        return
      }

      if (visited.has(node)) {
        return
      }

      visited.add(node)
      recursionStack.add(node)

      const dependencies = this.dependencyGraph.get(node)
      if (dependencies) {
        for (const dep of dependencies) {
          dfs(dep, [...path, node])
        }
      }

      recursionStack.delete(node)
    }

    for (const node of this.dependencyGraph.keys()) {
      if (!visited.has(node)) {
        dfs(node, [])
      }
    }

    return cycles
  }

  /**
   * Get a formatted dependency graph for debugging
   */
  getFormattedDependencyGraph(): string {
    let output = 'Dependency Graph:\n'
    output += '================\n'

    for (const [node, dependencies] of this.dependencyGraph) {
      output += `${node}\n`
      if (dependencies.size > 0) {
        for (const dep of dependencies) {
          output += `  └─ depends on → ${dep}\n`
        }
      } else {
        output += `  └─ (no dependencies)\n`
      }
    }

    return output
  }

  /**
   * Validate that the dependency graph is acyclic
   */
  validateGraph(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const analysis = this.analyzeDependencyGraph()

    // Check for circular dependencies
    if (analysis.circularDependencies.length > 0) {
      for (const cycle of analysis.circularDependencies) {
        errors.push(`Circular dependency: ${cycle.join(' -> ')}`)
      }
    }

    // Check for excessive depth
    if (analysis.maxDepth > 10) {
      errors.push(`Excessive dependency depth: ${analysis.maxDepth} (path: ${analysis.deepestPath.join(' -> ')})`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get statistics about current resolution activity
   */
  getResolutionStats(): {
    activeResolutions: number
    maxActiveDepth: number
    totalDependencies: number
    averageDependencies: number
  } {
    let activeResolutions = 0
    let maxActiveDepth = 0

    for (const stack of this.resolutionStacks.values()) {
      activeResolutions += stack.length
      maxActiveDepth = Math.max(maxActiveDepth, stack.length)
    }

    const totalDependencies = Array.from(this.dependencyGraph.values())
      .reduce((sum, deps) => sum + deps.size, 0)

    const averageDependencies = this.dependencyGraph.size > 0
      ? totalDependencies / this.dependencyGraph.size
      : 0

    return {
      activeResolutions,
      maxActiveDepth,
      totalDependencies,
      averageDependencies,
    }
  }

  /**
   * Create a safe wrapper for dependency resolution with circular detection
   */
  createSafeResolver<T>(
    token: string,
    resolver: () => T
  ): T {
    this.startResolution(token)

    try {
      const result = resolver()
      return result
    } finally {
      this.endResolution(token)
    }
  }

  /**
   * Create a safe wrapper for dependency resolution with dependency tracking
   */
  createSafeResolverWithDependency<T>(
    token: string,
    dependency: string,
    resolver: () => T
  ): T {
    // Check for circular dependency
    this.checkCircularDependency(token, dependency)

    // Add to dependency graph
    this.addDependency(token, dependency)

    return this.createSafeResolver(token, resolver)
  }
}

// Export singleton instance
export const circularDependencyDetector = CircularDependencyDetector.getInstance()

// Convenience functions
export const checkCircularDependency = (token: string, dependency: string) => {
  circularDependencyDetector.checkCircularDependency(token, dependency)
}

export const addDependency = (from: string, to: string) => {
  circularDependencyDetector.addDependency(from, to)
}

export const validateDependencyGraph = () => {
  return circularDependencyDetector.validateGraph()
}

export const analyzeDependencyGraph = () => {
  return circularDependencyDetector.analyzeDependencyGraph()
}