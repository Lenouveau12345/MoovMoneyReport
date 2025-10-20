/**
 * Script pour tester la connexion à la base de données Neon
 * Usage: node test-neon-connection.js
 */

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Test de connexion à la base de données...');
    
    // Test de connexion basique
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie !');
    
    // Test des tables
    console.log('\n📊 Vérification des tables...');
    
    const transactionCount = await prisma.transaction.count();
    console.log(`📈 Nombre de transactions: ${transactionCount}`);
    
    const importSessionCount = await prisma.importSession.count();
    console.log(`📥 Nombre de sessions d'import: ${importSessionCount}`);
    
    const userCount = await prisma.user.count();
    console.log(`👥 Nombre d'utilisateurs: ${userCount}`);
    
    // Test d'une requête complexe
    console.log('\n🔍 Test d\'une requête complexe...');
    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        transactionId: true,
        originalAmount: true,
        transactionType: true,
        createdAt: true
      }
    });
    
    console.log(`📋 Dernières ${recentTransactions.length} transactions:`);
    recentTransactions.forEach((tx, index) => {
      console.log(`  ${index + 1}. ${tx.transactionId} - ${tx.originalAmount} - ${tx.transactionType} - ${tx.createdAt.toISOString()}`);
    });
    
    console.log('\n✅ Tous les tests sont passés ! La connexion à Neon fonctionne correctement.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la connexion à la base de données:');
    console.error(error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Suggestion: Vérifiez votre URL de connexion dans .env.local');
      console.log('   Assurez-vous que l\'URL Neon est correcte et accessible.');
    } else if (error.code === 'P2021') {
      console.log('\n💡 Suggestion: La table n\'existe pas. Exécutez les migrations:');
      console.log('   npx prisma migrate dev');
    } else if (error.code === 'P1017') {
      console.log('\n💡 Suggestion: Problème de connexion SSL. Vérifiez votre URL de connexion.');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testConnection();
