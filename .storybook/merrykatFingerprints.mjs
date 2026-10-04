import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Generates merrykat-fingerprints.json next to index.json in the Storybook
// build, so Merrykat can skip stories whose fingerprint is unchanged. See
// https://merrykat.dev/docs/fingerprints.
//
// A story file's fingerprint is a hash of every source file it (transitively)
// imports. Whatever can change a render without showing up in those imports
// goes into `global`: the Storybook config, static assets, the lockfile (which
// stands in for everything under node_modules) and inlined env vars.

const OUTPUT_FILE = 'merrykat-fingerprints.json';
const STORY_FILE = /\.stories\.(js|jsx|ts|tsx|mdx)$/;
const INLINED_ENV = /^(STORYBOOK_|NEXT_PUBLIC_)/;

function sha256(...parts) {
  const hash = crypto.createHash('sha256');
  for (const part of parts) {
    hash.update(part);
    hash.update('\0');
  }
  return hash.digest('hex');
}

/**
 * Builds the contents of merrykat-fingerprints.json. All paths are relative to
 * the repo root and posix-style, so two CI machines produce the same hashes.
 *
 * @param {object} input
 * @param {Record<string, string[]>} input.closures story file -> files it imports (itself included)
 * @param {string[]} input.globalFiles files that affect every story
 * @param {Record<string, string>} [input.env] inlined env vars
 * @param {(file: string) => Buffer | string} input.readFile
 */
export function buildFingerprints({ closures, globalFiles, env = {}, readFile }) {
  const fileHashes = new Map();
  const hashFile = (file) => {
    if (!fileHashes.has(file)) {
      fileHashes.set(file, sha256(readFile(file)));
    }
    return fileHashes.get(file);
  };
  const hashFiles = (files) =>
    sha256(...[...new Set(files)].sort().flatMap((file) => [file, hashFile(file)]));

  const envEntries = Object.keys(env)
    .sort()
    .map((name) => `${name}=${env[name]}`);

  const result = {
    version: 1,
    global: sha256(hashFiles(globalFiles), ...envEntries),
    files: {},
    closures: {},
  };
  // Sorted keys: webpack doesn't iterate modules in a stable order.
  for (const story of Object.keys(closures).sort()) {
    const key = `./${story}`;
    result.files[key] = hashFiles(closures[story]);
    result.closures[key] = [...new Set(closures[story])].sort();
  }
  return result;
}

function listFiles(target) {
  if (!fs.existsSync(target)) return [];
  if (!fs.statSync(target).isDirectory()) return [target];
  return fs
    .readdirSync(target)
    .flatMap((entry) => listFiles(path.join(target, entry)));
}

export class MerrykatFingerprintsPlugin {
  /**
   * @param {object} options
   * @param {string} options.root repo root
   * @param {string[]} options.globalPaths files and directories (absolute) that affect every story
   */
  constructor({ root, globalPaths }) {
    this.root = root;
    this.globalPaths = globalPaths;
  }

  // Repo-relative path of a module's source file, or null for modules that
  // aren't source files in the repo (node_modules, runtime modules, externals).
  relativeResource(module) {
    // data: URIs are modules too, but their content lives in the importing file.
    if (!module.resource || !path.isAbsolute(module.resource)) return null;
    const file = module.resource.split('?')[0];
    const relative = path.relative(this.root, file).split(path.sep).join('/');
    if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
    if (relative.split('/').includes('node_modules')) return null;
    return relative;
  }

  closureOf(module, moduleGraph) {
    const seen = new Set([module]);
    const queue = [module];
    const files = [];
    while (queue.length) {
      const current = queue.pop();
      const file = this.relativeResource(current);
      if (file) files.push(file);
      for (const connection of moduleGraph.getOutgoingConnections(current)) {
        if (connection.module && !seen.has(connection.module)) {
          seen.add(connection.module);
          queue.push(connection.module);
        }
      }
    }
    return files;
  }

  apply(compiler) {
    const { Compilation, sources } = compiler.webpack;
    const name = 'MerrykatFingerprintsPlugin';

    compiler.hooks.thisCompilation.tap(name, (compilation) => {
      let fingerprints;

      // Not processAssets: by then story files may have been concatenated into
      // other modules and are gone from compilation.modules.
      compilation.hooks.finishModules.tap(name, (modules) => {
        const closures = {};
        const globalFiles = this.globalPaths
          .flatMap(listFiles)
          .map((file) => path.relative(this.root, file).split(path.sep).join('/'));
        const storybookDir = `${path.relative(this.root, import.meta.dirname)}/`;

        for (const module of modules) {
          const file = this.relativeResource(module);
          if (!file) continue;
          if (STORY_FILE.test(file)) {
            closures[file] = this.closureOf(module, compilation.moduleGraph);
          } else if (file.startsWith(storybookDir)) {
            // preview.js and whatever it imports renders with every story.
            globalFiles.push(...this.closureOf(module, compilation.moduleGraph));
          }
        }

        const env = Object.fromEntries(
          Object.entries(process.env).filter(([key]) => INLINED_ENV.test(key)),
        );
        fingerprints = buildFingerprints({
          closures,
          globalFiles,
          env,
          readFile: (file) => fs.readFileSync(path.join(this.root, file)),
        });
      });

      compilation.hooks.processAssets.tap(
        { name, stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
        () => {
          compilation.emitAsset(
            OUTPUT_FILE,
            new sources.RawSource(`${JSON.stringify(fingerprints, null, 2)}\n`),
          );
        },
      );
    });
  }
}
