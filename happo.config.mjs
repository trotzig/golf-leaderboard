import { loadEnvFile } from 'node:process';
import { defineConfig } from 'happo';

try {
  loadEnvFile('.env');
} catch (error) {
  console.log('No .env file found');
}

export default defineConfig({
  apiKey: process.env.HAPPO_API_KEY,
  apiSecret: process.env.HAPPO_API_SECRET,
  integration: {
    type: 'storybook',
    configDir: '.storybook',
  },
  targets: {
    chrome: { type: 'chrome', viewport: '1024x768' },
    firefox: { type: 'firefox', viewport: '1024x768' },
    safari: { type: 'safari', viewport: '1024x768' },
    iphone: { type: 'ios-safari', viewport: '1024x768' },
    edge: { type: 'edge', viewport: '1024x768' },
    'chrome-dark': {
      type: 'chrome',
      viewport: '1024x768',
      prefersColorScheme: 'dark',
    },
  },
});
