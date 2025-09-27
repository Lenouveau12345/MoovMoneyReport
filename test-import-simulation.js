const { PrismaClient } = require('@prisma/client');

async function testImportSimulation() {
  console.log('=== TEST DE SIMULATION D\'IMPORT ===');
  
  const prisma = new PrismaClient();
  
  try {
    // Créer une session d'import de test
    console.log('\n1. Création d\'une session d\'import...');
    const importSession = await prisma.importSession.create({
      data: {
        fileName: 'test-simulation.csv',
        fileSize: 1000,
        totalRows: 3,
        validRows: 3,
        importedRows: 0,
        status: 'SUCCESS',
      }
    });
    console.log('✅ Session créée:', importSession.id);
    
    // Données de test
    const testTransactions = [
      {
        transactionId: 'TEST_001',
        transactionInitiatedTime: new Date('2024-01-01T10:00:00Z'),
        frmsisdn: '237123456789',
        tomsisdn: '237987654321',
        frProfile: 'USER',
        toProfile: 'USER',
        transactionType: 'TRANSFER',
        originalAmount: 1000.0,
        fee: 50.0,
        commissionAll: 25.0,
        merchantsOnlineCashIn: 'N',
        importSessionId: importSession.id,
        commissionDistributeur: 10.0,
        commissionMarchand: 10.0,
        commissionRevendeur: 5.0,
        commissionSousDistributeur: 0.0,
      },
      {
        transactionId: 'TEST_002',
        transactionInitiatedTime: new Date('2024-01-01T11:00:00Z'),
        frmsisdn: '237111111111',
        tomsisdn: '237222222222',
        frProfile: 'USER',
        toProfile: 'USER',
        transactionType: 'TRANSFER',
        originalAmount: 2000.0,
        fee: 100.0,
        commissionAll: 50.0,
        merchantsOnlineCashIn: 'N',
        importSessionId: importSession.id,
        commissionDistributeur: 20.0,
        commissionMarchand: 20.0,
        commissionRevendeur: 10.0,
        commissionSousDistributeur: 0.0,
      }
    ];
    
    console.log('\n2. Insertion des transactions de test...');
    
    for (const transaction of testTransactions) {
      try {
        // Vérifier si la transaction existe déjà
        const existingTransaction = await prisma.transaction.findUnique({
          where: { transactionId: transaction.transactionId }
        });

        if (existingTransaction) {
          console.log(`⚠️ Transaction ${transaction.transactionId} existe déjà, ignorée`);
          continue;
        }

        // Créer la transaction
        const inserted = await prisma.transaction.create({
          data: transaction,
        });
        console.log(`✅ Transaction créée: ${inserted.id} (${transaction.transactionId})`);
        
      } catch (error) {
        console.error(`❌ Erreur lors de l'insertion de ${transaction.transactionId}:`, error.message);
      }
    }
    
    // Vérifier le résultat
    console.log('\n3. Vérification des résultats...');
    const finalTransactionCount = await prisma.transaction.count();
    const sessionTransactionCount = await prisma.transaction.count({
      where: { importSessionId: importSession.id }
    });
    
    console.log(`📊 Total des transactions: ${finalTransactionCount}`);
    console.log(`📊 Transactions de cette session: ${sessionTransactionCount}`);
    
    // Mettre à jour la session
    await prisma.importSession.update({
      where: { id: importSession.id },
      data: {
        importedRows: sessionTransactionCount,
      }
    });
    
    console.log('✅ Session mise à jour');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testImportSimulation();
