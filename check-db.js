// Script simple pour vérifier la base de données
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Vérification de la base de données...');
    
    // Compter les transactions
    const transactionCount = await prisma.transaction.count();
    console.log(`Nombre de transactions: ${transactionCount}`);
    
    // Compter les sessions d'import
    const sessionCount = await prisma.importSession.count();
    console.log(`Nombre de sessions d'import: ${sessionCount}`);
    
    // Afficher les dernières sessions
    const sessions = await prisma.importSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('\nDernières sessions d\'import:');
    sessions.forEach(session => {
      console.log(`- ${session.fileName}: ${session.importedRows}/${session.totalRows} lignes (${session.status})`);
    });
    
    // Afficher quelques transactions
    const transactions = await prisma.transaction.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\nDernières transactions:');
    transactions.forEach(tx => {
      console.log(`- ${tx.transactionId}: ${tx.originalAmount} (${tx.transactionInitiatedTime})`);
    });
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
