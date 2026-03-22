import { formatFiles, generateFiles, joinPathFragments, names } from '@nx/devkit';

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
  generateFiles(tree, joinPathFragments(import.meta.dirname, 'files'), projectRoot, templateVars);

  await formatFiles(tree);
}

export default generator;
