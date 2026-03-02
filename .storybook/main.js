import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('@storybook/react-webpack5').StorybookConfig} */
const config = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-webpack5-compiler-babel'],
  framework: '@storybook/react-webpack5',
  webpackFinal: async (config) => {
    config.resolve.alias['next/router'] = path.resolve(__dirname, 'mocks/next-router.js');
    return config;
  },
};

export default config;
