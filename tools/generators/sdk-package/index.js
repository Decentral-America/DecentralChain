const { formatFiles, generateFiles, joinPathFragments, names } = require('@nx/devkit');

/** @param {import("@nx/devkit").Tree} tree */
async function generator(tree, options) {
  const n = names(options.name);
  const projectRoot = `packages/${n.fileName}`;
  const layer = options.layer ?? 0;

  const templateVars = {
    description: options.description,
    layer,
    name: n.fileName,
    npmName: `@decentralchain/${n.fileName}`,
    tmpl: '',
  };

  // Scaffold from template files
  generateFiles(tree, joinPathFragments(__dirname, 'files'), projectRoot, templateVars);

  await formatFiles(tree);
}

module.exports = generator;
module.exports.default = generator;
