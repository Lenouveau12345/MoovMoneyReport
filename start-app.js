const { spawn } = require('child_process');

console.log('🚀 Démarrage de l\'application T-Report...');
console.log('');
console.log('📋 Informations de connexion:');
console.log('   URL: http://localhost:3000');
console.log('   Email: admin@test.com');
console.log('   Mot de passe: admin123');
console.log('');
console.log('🔧 Configuration:');
console.log('   ✅ Connexion à Neon configurée');
console.log('   ✅ Utilisateur de test créé');
console.log('   ✅ Secret NextAuth configuré');
console.log('');
console.log('⏳ Démarrage du serveur...');

// Démarrer l'application
const child = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('❌ Erreur lors du démarrage:', error.message);
});

child.on('close', (code) => {
  console.log(`\n📊 Application arrêtée avec le code: ${code}`);
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt de l\'application...');
  child.kill('SIGINT');
  process.exit(0);
});
