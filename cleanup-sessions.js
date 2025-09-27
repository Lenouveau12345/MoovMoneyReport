// Script pour nettoyer les sessions d'import annulées
const { PrismaClient } = require('@prisma/client');

async function cleanupSessions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== NETTOYAGE DES SESSIONS D\'IMPORT ===');
    
    // Supprimer les sessions avec 0 lignes importées
    const deletedSessions = await prisma.importSession.deleteMany({
      where: {
        importedRows: 0,
        status: 'CANCELLED'
      }
    });
    
    console.log(`✅ ${deletedSessions.count} sessions supprimées`);
    
    // Afficher les sessions restantes
    const remainingSessions = await prisma.importSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('\nSessions restantes:');
    remainingSessions.forEach(session => {
      console.log(`- ${session.fileName}: ${session.importedRows}/${session.totalRows} (${session.status})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupSessions();
