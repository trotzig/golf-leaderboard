require('dotenv').config();

const { RemoteBrowserTarget } = require('happo.io');
const happoPluginStorybook = require('happo-plugin-storybook');

module.exports = {
  apiKey: process.env.HAPPO_API_KEY,
  apiSecret: process.env.HAPPO_API_SECRET,
  targets: {
    chrome: new RemoteBrowserTarget('chrome', { viewport: '1024x768' }),
    'chrome-dark': new RemoteBrowserTarget('chrome', {
      viewport: '1024x768',
      colorScheme: 'dark',
    }),
    firefox: new RemoteBrowserTarget('firefox', { viewport: '1024x768' }),
    safari: new RemoteBrowserTarget('safari', { viewport: '1024x768' }),
    iphone: new RemoteBrowserTarget('ios-safari', { viewport: '1024x768' }),
    edge: new RemoteBrowserTarget('edge', { viewport: '1024x768' }),
  },
  plugins: [happoPluginStorybook()],
};
