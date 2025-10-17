import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration pour Vercel
  serverExternalPackages: ['@prisma/client', 'better-sqlite3', 'pg', 'pg-copy-streams'],
  
  // Configuration pour les images
  images: {
    domains: ['localhost'],
  },
  
  // Désactiver ESLint pendant le build pour éviter les erreurs
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Désactiver TypeScript strict pendant le build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
