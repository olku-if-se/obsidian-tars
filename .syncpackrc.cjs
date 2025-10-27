/**
 * Syncpack configuration for enforcing aligned dependency ranges across the monorepo.
 * Ensures packages share consistent versions and semver ranges for shared dependencies.
 * @see https://github.com/JamieMason/syncpack
 */
module.exports = {
  customTypes: {
    optional: {
      strategy: 'versionsByName',
      path: 'optionalDependencies',
    },
  },
  dependencyTypes: ['prod', 'dev', 'peer', 'optional'],
  versionGroups: [
    {
      packages: ['apps/*', 'packages/*'],
      dependencies: ['*'],
      dependencyTypes: ['prod', 'dev', 'peer', 'optional'],
      policy: 'sameRange',
    },
  ],
  semverGroups: [
    {
      range: '^',
      dependencyTypes: ['prod', 'dev', 'peer', 'optional'],
    },
  ],
};
