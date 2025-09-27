const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@moovmoney.com' }
    });

    if (existingUser) {
      console.log('✅ Utilisateur de test existe déjà:', existingUser.email);
      return;
    }

    // Créer l'utilisateur de test
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const user = await prisma.user.create({
      data: {
        email: 'admin@moovmoney.com',
        password: hashedPassword,
        name: 'Administrateur',
        role: 'ADMIN'
      }
    });

    console.log('✅ Utilisateur de test créé avec succès:');
    console.log('📧 Email:', user.email);
    console.log('🔑 Mot de passe: admin123');
    console.log('👤 Rôle:', user.role);
    console.log('');
    console.log('Vous pouvez maintenant vous connecter avec ces identifiants.');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
