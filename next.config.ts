import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The API checker avoids a Node 26 stdout race in Next's experimental CLI checker.
  experimental: { useTypeScriptCli: false },
};

export default nextConfig;
