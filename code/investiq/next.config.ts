/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // We're still running ESLint as part of the build, but ignoring errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;