/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
};

module.exports = {
  reactStrictMode: false,
};

// module.exports = {
//   reactStrictMode: false,
//   webpack: (config) => {
//     config.resolve.fallback = { fs: false, net: false };
//     return config;
//   },
// };
