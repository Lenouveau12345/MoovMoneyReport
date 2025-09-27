const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Test de connexion à la base de données...');
    
    // Test simple de comptage
    const transactionCount = await prisma.transaction.count();
    console.log('✅ Nombre de transactions:', transactionCount);
    
    const importSessionCount = await prisma.importSession.count();
    console.log('✅ Nombre de sessions d\'import:', importSessionCount);
    
    const userCount = await prisma.user.count();
    console.log('✅ Nombre d\'utilisateurs:', userCount);
    
    console.log('🎉 Base de données accessible!');
    
  } catch (error) {
    console.error('❌ Erreur de base de données:', error.message);
    console.error('Détails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();

