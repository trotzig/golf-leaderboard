import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Player photos used by story fixtures. Only these are copied into the build,
// so that the upload doesn't carry the full public/players directory.
const STORY_PLAYER_PHOTOS = [
  '010515-018', // David Lundgren
  '020618-005', // Algot Kleén
  '951227-001', // Rasmus Holmberg
  '2-3476', // Martin Leth Simonsen
  '179832', // Jannik de Bruyn
];

function playerPhotoStaticDirs() {
  const dirs = [];
  for (const id of STORY_PLAYER_PHOTOS) {
    for (const ext of ['jpg', 'png']) {
      const file = `../public/players/${id}.${ext}`;
      if (fs.existsSync(path.resolve(__dirname, file))) {
        dirs.push({ from: file, to: `/players/${id}.${ext}` });
      }
    }
  }
  return dirs;
}

/** @type {import('@storybook/react-webpack5').StorybookConfig} */
const config = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-webpack5-compiler-babel'],
  framework: '@storybook/react-webpack5',
  staticDirs: [
    { from: '../public/404-bg.jpg', to: '/404-bg.jpg' },
    ...playerPhotoStaticDirs(),
  ],
  webpackFinal: async (config) => {
    config.resolve.alias['next/router'] = path.resolve(__dirname, 'mocks/next-router.js');
    return config;
  },
};

export default config;
