import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { transform } from 'esbuild';

const SHOULD_TRANSFORM = /\/src\/emails\/.+\.jsx$/;

export async function load(url, context, nextLoad) {
  if (!url.startsWith('file://') || !SHOULD_TRANSFORM.test(url)) {
    return nextLoad(url, context);
  }
  const filename = fileURLToPath(url);
  const source = await readFile(filename, 'utf8');
  const result = await transform(source, {
    loader: 'jsx',
    format: 'esm',
    sourcemap: 'inline',
    sourcefile: filename,
  });
  return { format: 'module', source: result.code, shortCircuit: true };
}
