/**
 * Dependency-cruiser configuration for the workspace graphs.
 * Keeps the setup minimal while supporting the TypeScript project references and path aliases.
 */
module.exports = {
  forbidden: [],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: {
      path: '(^|\\/)dist/',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'],
      mainFields: ['exports', 'types', 'module', 'main'],
    },
  },
};
