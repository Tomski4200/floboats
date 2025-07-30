import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lvfshqpmvynjtdwlkupx.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/businesses',
        destination: '/directory',
        permanent: true,
      },
      {
        source: '/businesses/:slug',
        destination: '/directory/:slug',
        permanent: true,
      },
      {
        source: '/businesses/claim',
        destination: '/directory/claim',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
