import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Winner photos for the reports used in Reports.stories.js. Only these are
// copied into the build, so the upload doesn't carry all of public/players.
const REPORT_WINNER_IDS = ['020618-005', '951227-001', '010515-018', '2-3476'];

function winnerPhotoStaticDirs() {
  const dirs = [];
  for (const id of REPORT_WINNER_IDS) {
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
    { from: '../public/app-icon-192.png', to: '/app-icon-192.png' },
    ...winnerPhotoStaticDirs(),
  ],
  webpackFinal: async (config) => {
    config.resolve.alias['next/router'] = path.resolve(__dirname, 'mocks/next-router.js');
    return config;
  },
};

export default config;
