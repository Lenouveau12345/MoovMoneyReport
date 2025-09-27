const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUsers() {
  try {
    console.log('🌱 Création des utilisateurs...');

    // Créer un utilisateur admin
    const adminEmail = 'admin@moovmoney.com';
    const adminPassword = 'admin123';
    
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);
    
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        password: hashedAdminPassword,
        name: 'Administrateur',
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Utilisateur admin créé:', admin.email);

    // Créer un utilisateur normal
    const userEmail = 'user@moovmoney.com';
    const userPassword = 'user123';
    
    const hashedUserPassword = await bcrypt.hash(userPassword, 12);
    
    const user = await prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        email: userEmail,
        password: hashedUserPassword,
        name: 'Utilisateur',
        role: 'USER'
      }
    });
    
    console.log('✅ Utilisateur normal créé:', user.email);

    console.log('\n🎉 Comptes créés avec succès!');
    console.log('\n📋 Comptes disponibles:');
    console.log('👑 Admin:');
    console.log('   Email: admin@moovmoney.com');
    console.log('   Mot de passe: admin123');
    console.log('   Rôle: ADMIN');
    console.log('\n👤 Utilisateur:');
    console.log('   Email: user@moovmoney.com');
    console.log('   Mot de passe: user123');
    console.log('   Rôle: USER');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();
