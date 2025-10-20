/**
 * Script simple pour tester la connexion à Neon
 * Usage: node test-neon-connection-simple.js
 */

// Charger les variables d'environnement depuis .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

async function testNeonConnection() {
  console.log('🔍 Test de connexion à la base de données...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test de connexion basique
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie !');
    
    // Test des tables
    console.log('\n📊 Vérification des données...');
    
    const transactionCount = await prisma.transaction.count();
    console.log(`📈 Nombre de transactions: ${transactionCount}`);
    
    const importSessionCount = await prisma.importSession.count();
    console.log(`📥 Nombre de sessions d'import: ${importSessionCount}`);
    
    const userCount = await prisma.user.count();
    console.log(`👥 Nombre d'utilisateurs: ${userCount}`);
    
    // Test d'insertion simple
    console.log('\n🧪 Test d\'insertion simple...');
    const testTransaction = {
      transactionId: 'TEST_' + Date.now(),
      transactionInitiatedTime: new Date(),
      frmsisdn: '2250000000000',
      tomsisdn: '2250000000001',
      frProfile: 'TEST',
      toProfile: 'TEST',
      transactionType: 'Test Connection',
      originalAmount: 100,
      fee: 0,
      commissionAll: 0,
      merchantsOnlineCashIn: ''
    };
    
    const created = await prisma.transaction.create({
      data: testTransaction
    });
    
    console.log('✅ Transaction de test insérée avec succès!');
    console.log('   ID:', created.id);
    console.log('   Transaction ID:', created.transactionId);
    
    // Vérifier que la transaction a bien été insérée
    const verifyCount = await prisma.transaction.count();
    console.log(`📊 Nombre total de transactions après test: ${verifyCount}`);
    
    // Nettoyer la transaction de test
    await prisma.transaction.delete({
      where: { id: created.id }
    });
    
    console.log('🧹 Transaction de test supprimée');
    
    const finalCount = await prisma.transaction.count();
    console.log(`📊 Nombre final de transactions: ${finalCount}`);
    
    console.log('\n🎉 Test de connexion à Neon réussi !');
    console.log('   L\'application peut maintenant se connecter à votre base Neon.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:');
    console.error('   Message:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Suggestion: Vérifiez votre URL de connexion dans .env.local');
      console.log('   Assurez-vous que l\'URL Neon est correcte et accessible.');
    } else if (error.code === 'P2021') {
      console.log('\n💡 Suggestion: La table n\'existe pas. Exécutez:');
      console.log('   npx prisma migrate dev');
    } else if (error.code === 'P1017') {
      console.log('\n💡 Suggestion: Problème de connexion SSL. Vérifiez votre URL.');
    } else {
      console.log('\n💡 Erreur inconnue. Vérifiez:');
      console.log('   1. Votre URL de connexion Neon dans .env.local');
      console.log('   2. Que votre base Neon est accessible');
      console.log('   3. Que les migrations ont été appliquées');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testNeonConnection();
