const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Script de déploiement Git pour Vercel\n');

// Vérifier si on est dans un repo Git
try {
  execSync('git status', { stdio: 'pipe' });
  console.log('✅ Repository Git détecté');
} catch (error) {
  console.log('❌ Pas de repository Git. Initialisation...');
  execSync('git init', { stdio: 'inherit' });
}

// Vérifier les fichiers non commités
try {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    console.log('📝 Fichiers modifiés détectés:');
    console.log(status);
    
    console.log('\n🔄 Ajout des fichiers...');
    execSync('git add .', { stdio: 'inherit' });
    
    console.log('💾 Commit des changements...');
    const commitMessage = process.argv[2] || 'Deploy to Vercel - Update application';
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    console.log('✅ Changements commités');
  } else {
    console.log('✅ Aucun changement à commiter');
  }
} catch (error) {
  console.error('❌ Erreur lors du commit:', error.message);
  process.exit(1);
}

// Vérifier la branche actuelle
try {
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  console.log(`📍 Branche actuelle: ${branch}`);
  
  if (branch !== 'main' && branch !== 'master') {
    console.log('⚠️  Attention: Vous n\'êtes pas sur la branche principale');
    console.log('   Vercel déploie généralement depuis "main" ou "master"');
  }
} catch (error) {
  console.error('❌ Erreur lors de la vérification de la branche:', error.message);
}

// Instructions pour le push
console.log('\n📋 Étapes suivantes:');
console.log('1. Poussez vers GitHub:');
console.log('   git push origin main');
console.log('   (ou git push origin master)');
console.log('\n2. Si c\'est votre premier push:');
console.log('   git remote add origin https://github.com/votre-username/votre-repo.git');
console.log('   git push -u origin main');
console.log('\n3. Connectez votre repo à Vercel:');
console.log('   - Allez sur https://vercel.com/dashboard');
console.log('   - Cliquez sur "New Project"');
console.log('   - Importez votre repository GitHub');
console.log('   - Configurez les variables d\'environnement');
console.log('\n4. Vercel déploiera automatiquement à chaque push !');

console.log('\n✅ Script terminé!');
