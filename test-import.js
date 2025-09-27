// Test simple pour diagnostiquer le problème d'import
const { PrismaClient } = require('@prisma/client');

async function testImport() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== DIAGNOSTIC IMPORT ===');
    
    // 1. Vérifier les sessions d'import récentes
    const recentSessions = await prisma.importSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('\n1. Sessions d\'import récentes:');
    recentSessions.forEach(session => {
      console.log(`- ${session.fileName}: ${session.importedRows}/${session.totalRows} (${session.status}) - ${session.createdAt}`);
      if (session.errorMessage) {
        console.log(`  Erreur: ${session.errorMessage}`);
      }
    });
    
    // 2. Compter les transactions
    const transactionCount = await prisma.transaction.count();
    console.log(`\n2. Nombre total de transactions: ${transactionCount}`);
    
    // 3. Vérifier les transactions récentes
    const recentTransactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    
    console.log('\n3. Transactions récentes:');
    recentTransactions.forEach(tx => {
      console.log(`- ${tx.transactionId}: ${tx.originalAmount} (${tx.createdAt})`);
    });
    
    // 4. Tester une insertion simple
    console.log('\n4. Test d\'insertion simple...');
    const testTransaction = await prisma.transaction.create({
      data: {
        transactionId: `TEST-${Date.now()}`,
        transactionInitiatedTime: new Date(),
        frmsisdn: '1234567890',
        tomsisdn: '0987654321',
        frProfile: 'TEST',
        toProfile: 'TEST',
        transactionType: 'TEST',
        originalAmount: 100,
        fee: 5,
        commissionAll: 2.5,
        merchantsOnlineCashIn: 'test'
      }
    });
    
    console.log(`✅ Transaction de test créée: ${testTransaction.transactionId}`);
    
    // 5. Vérifier le nouveau count
    const newCount = await prisma.transaction.count();
    console.log(`\n5. Nouveau nombre de transactions: ${newCount}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testImport();
