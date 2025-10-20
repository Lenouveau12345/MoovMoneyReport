/**
 * Vérification des transactions liées à la session d'import pour les fichiers découpés
 */

// Charger les variables d'environnement depuis .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

async function verifyChunkedSession() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Vérification des sessions d\'import pour fichiers découpés...');
    
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
        where: { importSessionId: lastImportSession.id }
      });
      
      console.log(`\n📊 Transactions liées à cette session (${transactions.length} trouvées):`);
      transactions.forEach((tx, index) => {
        console.log(`  ${index + 1}. ID: ${tx.id}`);
        console.log(`     Transaction ID: ${tx.transactionId}`);
        console.log(`     Session ID: ${tx.importSessionId}`);
        console.log(`     Date: ${tx.transactionInitiatedTime}`);
        console.log(`     De: ${tx.frmsisdn} (${tx.frName || 'N/A'})`);
        console.log(`     Vers: ${tx.tomsisdn} (${tx.toName || 'N/A'})`);
        console.log(`     Type: ${tx.transactionType}`);
        console.log(`     Montant: ${tx.originalAmount}`);
        console.log('');
      });
      
      // Vérifier la cohérence des données
      console.log('🔍 Vérification de la cohérence:');
      console.log(`  - Transactions attendues selon la session: ${lastImportSession.importedRows}`);
      console.log(`  - Transactions réellement trouvées: ${transactions.length}`);
      console.log(`  - Cohérence: ${lastImportSession.importedRows === transactions.length ? '✅' : '❌'}`);
      
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
    console.log(`  - Pourcentage de transactions avec session: ${Math.round((transactionsWithSession / totalTransactions) * 100)}%`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyChunkedSession();
