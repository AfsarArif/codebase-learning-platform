/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@codebase-learning/shared',
    '@codebase-learning/github',
    '@codebase-learning/prompts',
    '@codebase-learning/ui',
  ],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

module.exports = nextConfig;
