const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function checkAuth() {
  const prisma = new PrismaClient();
  
  try {
    // Vérifier la connexion
    console.log('🔍 Vérification de la connexion à la base...');
    await prisma.$connect();
    console.log('✅ Connexion OK');
    
    // Vérifier l'utilisateur admin
    console.log('🔍 Recherche de l\'utilisateur admin...');
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@moovmoney.com' }
    });
    
    if (!admin) {
      console.log('❌ Utilisateur admin non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur admin trouvé:');
    console.log('  - ID:', admin.id);
    console.log('  - Email:', admin.email);
    console.log('  - Role:', admin.role);
    console.log('  - Mot de passe hashé:', admin.password ? 'Oui' : 'Non');
    console.log('  - Longueur du hash:', admin.password?.length || 0);
    
    // Tester le mot de passe
    console.log('🔍 Test du mot de passe...');
    const isValid = await bcrypt.compare('admin123', admin.password);
    console.log('✅ Mot de passe valide:', isValid);
    
    if (!isValid) {
      console.log('🔧 Correction du mot de passe...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await prisma.user.update({
        where: { id: admin.id },
        data: { password: hashedPassword }
      });
      console.log('✅ Mot de passe corrigé');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuth();
