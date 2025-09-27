const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Configuration du déploiement Vercel...\n');

// Vérifier si Vercel CLI est installé
try {
  execSync('vercel --version', { stdio: 'pipe' });
  console.log('✅ Vercel CLI détecté');
} catch (error) {
  console.log('❌ Vercel CLI non trouvé. Installation...');
  execSync('npm install -g vercel', { stdio: 'inherit' });
}

// Créer le fichier .env.example pour la production
const envExample = `# Configuration pour la production
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-super-secret-key-here-change-in-production
DATABASE_URL=postgresql://username:password@host:port/database

# Pour le développement local, utilisez:
# NEXTAUTH_URL=http://localhost:3000
# DATABASE_URL=file:./prisma/dev.db
`;

fs.writeFileSync('.env.example', envExample);
console.log('✅ Fichier .env.example créé');

// Instructions
console.log('\n📋 Étapes suivantes:');
console.log('1. Créez une base de données PostgreSQL (recommandé: Neon, Supabase, ou Railway)');
console.log('2. Configurez les variables d\'environnement dans Vercel');
console.log('3. Exécutez: vercel --prod');
console.log('\n🔗 Liens utiles:');
console.log('- Neon (PostgreSQL gratuit): https://neon.tech');
console.log('- Supabase: https://supabase.com');
console.log('- Railway: https://railway.app');
console.log('- Vercel Dashboard: https://vercel.com/dashboard');

console.log('\n✅ Configuration terminée!');
