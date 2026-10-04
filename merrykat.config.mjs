export default {
  compare: {
    // Fingerprints come from .storybook/merrykatFingerprints.mjs. 'verify' still
    // compares every story and reports where the fingerprints were wrong;
    // switch to 'auto' to start skipping unchanged stories.
    fingerprints: 'verify',
  },
  viewports: [
    { name: 'desktop', width: 1280, height: 800 },
    {
      name: 'desktop-dark',
      width: 1280,
      height: 800,
      media: { colorScheme: 'dark' },
    },
    {
      name: 'mobile',
      width: 390,
      height: 844,
      media: { colorScheme: 'light' },
    },
  ],
};
