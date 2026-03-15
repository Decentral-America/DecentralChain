const { createNodesFromFiles } = require('@nx/devkit');
const { dirname } = require('node:path');

async function createNodesInternal(configFilePath) {
  const root = dirname(configFilePath);

  if (root === '.') {
    return {};
  }

  return {
    projects: {
      [root]: {
        targets: {
          'biome-fix': {
            cache: false,
            command: 'pnpm biome check --write {projectRoot}',
          },
          'biome-lint': {
            cache: true,
            command: 'pnpm biome check {projectRoot}',
            inputs: [
              'default',
              '^default',
              '{workspaceRoot}/biome.json',
              {
                externalDependencies: ['@biomejs/biome'],
              },
            ],
          },
        },
      },
    },
  };
}

const createNodes = [
  '**/biome.json',
  async (configFiles, options, context) => {
    return createNodesFromFiles(
      (configFilePath) => createNodesInternal(configFilePath),
      configFiles,
      options,
      context,
    );
  },
];

module.exports = {
  createNodes,
  createNodesV2: createNodes,
};
