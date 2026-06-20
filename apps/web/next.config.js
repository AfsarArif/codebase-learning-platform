const path = require('path');

// Load .env from monorepo root — ensures DATABASE_URL and other vars
// are always available regardless of which directory the server starts from
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
} catch {
  // dotenv not available — env vars must be set externally
}

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
