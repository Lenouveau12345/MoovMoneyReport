const { PrismaClient } = require('@prisma/client');

async function checkStatus() {
  const prisma = new PrismaClient();
  
  try {
    const transactionCount = await prisma.transaction.count();
    const importCount = await prisma.importSession.count();
    const lastImports = await prisma.importSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('=== STATUT BASE DE DONNÉES ===');
    console.log('Transactions:', transactionCount);
    console.log('Sessions d\'import:', importCount);
    console.log('\n=== DERNIERS IMPORTS ===');
    lastImports.forEach((import_, index) => {
      console.log(`${index + 1}. ${import_.fileName} - ${import_.status} - ${import_.importedRows}/${import_.totalRows} - ${import_.createdAt.toISOString()}`);
    });
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();
