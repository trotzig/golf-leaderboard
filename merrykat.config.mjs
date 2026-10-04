export default {
  compare: {
    // Fingerprints come from .storybook/merrykatFingerprints.mjs. Stories whose
    // fingerprint is unchanged are skipped, apart from a small audit sample.
    fingerprints: 'auto',
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
