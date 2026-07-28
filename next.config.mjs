/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Retired in Sprint 7.6's brand repositioning - "Tools" is no longer
      // a standalone nav item; AI Solutions on /services covers the same
      // ground (AI agents, automation, custom applications).
      { source: "/tools", destination: "/services", permanent: true },
    ];
  },
};

export default nextConfig;
