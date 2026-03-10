/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/ludvig-eriksson',
        destination: '/ludvig-eriksson-69c',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
