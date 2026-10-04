import { describe, expect, it } from 'vitest';

import { buildFingerprints } from './merrykatFingerprints.mjs';

const FILES = {
  'src/A.js': 'a',
  'src/B.js': 'b',
  'src/shared.js': 'shared',
  'src/stories/A.stories.js': 'a story',
  'src/stories/B.stories.js': 'b story',
  'pnpm-lock.yaml': 'lock',
};

function build({ files = FILES, env, closures, globalFiles } = {}) {
  return buildFingerprints({
    closures: closures || {
      'src/stories/A.stories.js': ['src/stories/A.stories.js', 'src/A.js', 'src/shared.js'],
      'src/stories/B.stories.js': ['src/stories/B.stories.js', 'src/B.js', 'src/shared.js'],
    },
    globalFiles: globalFiles || ['pnpm-lock.yaml'],
    env,
    readFile: (file) => files[file],
  });
}

describe('buildFingerprints', () => {
  it('keys files by import path, the way index.json spells them', () => {
    const result = build();
    expect(result.version).toBe(1);
    expect(Object.keys(result.files)).toEqual([
      './src/stories/A.stories.js',
      './src/stories/B.stories.js',
    ]);
    expect(result.closures['./src/stories/A.stories.js']).toEqual([
      'src/A.js',
      'src/shared.js',
      'src/stories/A.stories.js',
    ]);
  });

  it('only changes the fingerprint of stories that import a changed file', () => {
    const before = build();
    const after = build({ files: { ...FILES, 'src/A.js': 'changed' } });
    expect(after.files['./src/stories/A.stories.js']).not.toBe(
      before.files['./src/stories/A.stories.js'],
    );
    expect(after.files['./src/stories/B.stories.js']).toBe(
      before.files['./src/stories/B.stories.js'],
    );
    expect(after.global).toBe(before.global);
  });

  it('changes every fingerprint when a shared file changes', () => {
    const before = build();
    const after = build({ files: { ...FILES, 'src/shared.js': 'changed' } });
    for (const key of Object.keys(before.files)) {
      expect(after.files[key]).not.toBe(before.files[key]);
    }
  });

  it('changes the global fingerprint when a global file or env var changes', () => {
    const before = build();
    expect(build({ files: { ...FILES, 'pnpm-lock.yaml': 'bumped' } }).global).not.toBe(
      before.global,
    );
    expect(build({ env: { NEXT_PUBLIC_GOLFBOX_OOM_ID: '1' } }).global).not.toBe(before.global);
    expect(build().files).toEqual(before.files);
  });

  it('is independent of the order modules are visited in', () => {
    const reordered = build({
      closures: {
        'src/stories/B.stories.js': ['src/shared.js', 'src/B.js', 'src/stories/B.stories.js'],
        'src/stories/A.stories.js': ['src/shared.js', 'src/shared.js', 'src/stories/A.stories.js', 'src/A.js'],
      },
    });
    expect(JSON.stringify(reordered)).toBe(JSON.stringify(build()));
  });
});
