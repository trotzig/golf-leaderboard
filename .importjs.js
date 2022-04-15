const fs = require('fs');

module.exports = {
  stripFileExtensions: [],
  declarationKeyword({ pathToCurrentFile }) {
    if (
      pathToCurrentFile.endsWith('-happo.js') ||
      pathToCurrentFile.endsWith('-test.js') ||
      /\/pages\//.test(pathToCurrentFile)
    ) {
      return 'import';
    }

    try {
      if (/(export |import )/.test(fs.readFileSync(pathToCurrentFile))) {
        return 'import';
      }
    } catch (e) {}
    return 'const';
  },
  namedExports: {
    react: ['useEffect', 'useState', 'useRef'],
  },
  globals: ['console', 'document'],
  logLevel: 'debug',
  excludes: [
    './.next/**',
    './.cron-logs/**',
  ],
  ignorePackagePrefixes: ['react-'],
};
