import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(request: NextRequest) {
  try {
    console.log('=== DÉBUT SUPPRESSION HISTORIQUE IMPORTS ===');
    
    // Compter avant suppression pour les logs
    const transactionsCount = await prisma.transaction.count();
    const importSessionsCount = await prisma.importSession.count();
    
    console.log('Transactions à supprimer:', transactionsCount);
    console.log('Sessions d\'import à supprimer:', importSessionsCount);
    
    // Supprimer toutes les transactions (cascade avec les sessions d'import)
    const deletedTransactions = await prisma.transaction.deleteMany({});
    console.log('Transactions supprimées:', deletedTransactions.count);
    
    // Supprimer toutes les sessions d'import
    const deletedImportSessions = await prisma.importSession.deleteMany({});
    console.log('Sessions d\'import supprimées:', deletedImportSessions.count);
    
    // Vérifier que tout a été supprimé
    const remainingTransactions = await prisma.transaction.count();
    const remainingImportSessions = await prisma.importSession.count();
    
    console.log('=== FIN SUPPRESSION ===');
    console.log('Transactions restantes:', remainingTransactions);
    console.log('Sessions d\'import restantes:', remainingImportSessions);
    
    return NextResponse.json({
      success: true,
      message: 'Historique des imports vidé avec succès',
      deletedTransactions: deletedTransactions.count,
      deletedImportSessions: deletedImportSessions.count,
    }, { 
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      } 
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'historique des imports:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la suppression de l\'historique des imports',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
