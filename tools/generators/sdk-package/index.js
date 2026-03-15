const {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  joinPathFragments,
  names,
  Tree,
} = require('@nx/devkit');
const path = require('node:path');

/** @param {import("@nx/devkit").Tree} tree */
async function generator(tree, options) {
  const n = names(options.name);
  const projectRoot = `packages/${n.fileName}`;
  const layer = options.layer ?? 0;

  const templateVars = {
    name: n.fileName,
    npmName: `@decentralchain/${n.fileName}`,
    description: options.description,
    layer,
    tmpl: '',
  };

  // Scaffold from template files
  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    projectRoot,
    templateVars,
  );

  await formatFiles(tree);
}

module.exports = generator;
module.exports.default = generator;
