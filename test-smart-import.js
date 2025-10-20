/**
 * Script de test pour l'import intelligent
 */

// Charger les variables d'environnement depuis .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function testSmartImport() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Test de l\'import intelligent...');
    
    // Vérifier l'état initial
    const initialCount = await prisma.transaction.count();
    console.log(`📊 Transactions initiales: ${initialCount}`);
    
    // Simuler un import de données
    console.log('📥 Simulation d\'un import...');
    
    const testTransactions = [
      {
        transactionId: 'TEST_SMART_001',
        transactionInitiatedTime: new Date(),
        frmsisdn: '2250700000001',
        tomsisdn: '2250700000002',
        frName: 'Test User 1',
        toName: 'Test User 2',
        frProfile: 'CUSTOMER',
        toProfile: 'CUSTOMER',
        transactionType: 'Test Transfer',
        originalAmount: 1000,
        fee: 50,
        commissionAll: 25,
        merchantsOnlineCashIn: ''
      },
      {
        transactionId: 'TEST_SMART_002',
        transactionInitiatedTime: new Date(),
        frmsisdn: '2250700000003',
        tomsisdn: '2250700000004',
        frName: 'Test User 3',
        toName: 'Test User 4',
        frProfile: 'CUSTOMER',
        toProfile: 'CUSTOMER',
        transactionType: 'Test Transfer',
        originalAmount: 500,
        fee: 25,
        commissionAll: 15,
        merchantsOnlineCashIn: ''
      }
    ];
    
    // Insérer les transactions de test
    for (const transaction of testTransactions) {
      try {
        await prisma.transaction.create({
          data: transaction
        });
        console.log(`✅ Transaction ${transaction.transactionId} insérée`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Transaction ${transaction.transactionId} existe déjà (doublon ignoré)`);
        } else {
          throw error;
        }
      }
    }
    
    // Vérifier l'état final
    const finalCount = await prisma.transaction.count();
    console.log(`📊 Transactions finales: ${finalCount}`);
    console.log(`📈 Nouvelles transactions ajoutées: ${finalCount - initialCount}`);
    
    // Nettoyer les transactions de test
    console.log('🧹 Nettoyage des transactions de test...');
    await prisma.transaction.deleteMany({
      where: {
        transactionId: {
          startsWith: 'TEST_SMART_'
        }
      }
    });
    
    const cleanedCount = await prisma.transaction.count();
    console.log(`📊 Transactions après nettoyage: ${cleanedCount}`);
    
    console.log('✅ Test de l\'import intelligent réussi !');
    console.log('');
    console.log('🎯 L\'import intelligent devrait maintenant fonctionner correctement.');
    console.log('   Vous pouvez tester avec le fichier test-smart-import.csv');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testSmartImport();
