import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration pour Vercel
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'better-sqlite3'],
  },
  
  // Configuration pour les images
  images: {
    domains: ['localhost'],
  },
  
  // Configuration pour les API routes
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default nextConfig;
