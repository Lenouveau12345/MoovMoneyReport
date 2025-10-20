/**
 * Vérification de la session d'import et des transactions liées
 */

// Charger les variables d'environnement depuis .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

async function verifySessionImport() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Vérification des sessions d\'import et transactions...');
    
    // Récupérer la dernière session d'import
    const lastImportSession = await prisma.importSession.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (lastImportSession) {
      console.log('📋 Dernière session d\'import:');
      console.log(`  - ID: ${lastImportSession.id}`);
      console.log(`  - Nom du fichier: ${lastImportSession.fileName}`);
      console.log(`  - Taille: ${lastImportSession.fileSize} bytes`);
      console.log(`  - Total lignes: ${lastImportSession.totalRows}`);
      console.log(`  - Lignes valides: ${lastImportSession.validRows}`);
      console.log(`  - Lignes importées: ${lastImportSession.importedRows}`);
      console.log(`  - Statut: ${lastImportSession.status}`);
      console.log(`  - Créée le: ${lastImportSession.createdAt}`);
      
      // Récupérer les transactions liées à cette session
      const transactions = await prisma.transaction.findMany({
        where: { importSessionId: lastImportSession.id },
        take: 5 // Limiter à 5 pour l'affichage
      });
      
      console.log(`\n📊 Transactions liées à cette session (${transactions.length} trouvées):`);
      transactions.forEach((tx, index) => {
        console.log(`  ${index + 1}. ID: ${tx.id}`);
        console.log(`     Transaction ID: ${tx.transactionId}`);
        console.log(`     Date: ${tx.transactionInitiatedTime}`);
        console.log(`     De: ${tx.frmsisdn} (${tx.frName || 'N/A'})`);
        console.log(`     Vers: ${tx.tomsisdn} (${tx.toName || 'N/A'})`);
        console.log(`     Type: ${tx.transactionType}`);
        console.log(`     Montant: ${tx.originalAmount}`);
        console.log('');
      });
      
      // Compter le total de transactions liées
      const totalTransactions = await prisma.transaction.count({
        where: { importSessionId: lastImportSession.id }
      });
      
      console.log(`📈 Total des transactions liées à cette session: ${totalTransactions}`);
      
    } else {
      console.log('❌ Aucune session d\'import trouvée');
    }
    
    // Afficher un résumé global
    const totalSessions = await prisma.importSession.count();
    const totalTransactions = await prisma.transaction.count();
    const transactionsWithSession = await prisma.transaction.count({
      where: { importSessionId: { not: null } }
    });
    
    console.log('\n📊 Résumé global:');
    console.log(`  - Total sessions d'import: ${totalSessions}`);
    console.log(`  - Total transactions: ${totalTransactions}`);
    console.log(`  - Transactions avec session: ${transactionsWithSession}`);
    console.log(`  - Transactions sans session: ${totalTransactions - transactionsWithSession}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifySessionImport();
