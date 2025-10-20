const fs = require('fs');

const envContent = `# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=super-secret-key-for-development-only-change-in-production

# Database - Neon PostgreSQL
DATABASE_URL="postgresql://neondb_owner:npg_JsbSh6Kr5ipc@ep-cool-dawn-adwueiaq-pooler.c-2.us-east-1.aws.neon.tech/dbmmreport?sslmode=require"

# Configuration pour les uploads
UPLOAD_TIMEOUT=300000
SSL_RETRY_COUNT=3
CHUNK_SIZE=10000
`;

try {
  fs.writeFileSync('.env.local', envContent, 'utf8');
  console.log('✅ Fichier .env.local créé avec succès!');
  console.log('📋 Contenu:');
  console.log(envContent);
} catch (error) {
  console.error('❌ Erreur lors de la création du fichier:', error.message);
}
