import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const importSessions = await prisma.importSession.findMany({
      orderBy: {
        importedAt: 'desc'
      },
      include: {
        transactions: {
          select: {
            id: true,
            transactionId: true,
            originalAmount: true,
            fee: true,
            commissionAll: true,
            commissionDistributeur: true,
            commissionSousDistributeur: true,
            commissionRevendeur: true,
            commissionMarchand: true,
            transactionType: true,
            transactionInitiatedTime: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      importSessions: importSessions.map(session => ({
        id: session.id,
        fileName: session.fileName,
        fileSize: session.fileSize,
        totalRows: session.totalRows,
        validRows: session.validRows,
        importedRows: session.importedRows,
        status: session.status,
        errorMessage: session.errorMessage,
        importedAt: session.importedAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        transactionCount: session.transactions.length,
        totalVolume: session.transactions.reduce((sum, t) => sum + t.originalAmount, 0),
        totalFees: session.transactions.reduce((sum, t) => sum + t.fee, 0),
        totalCommissions: session.transactions.reduce((sum, t) => sum + t.commissionAll, 0),
        totalCommissionDistributeur: session.transactions.reduce((sum, t) => sum + (t.commissionDistributeur || 0), 0),
        totalCommissionSousDistributeur: session.transactions.reduce((sum, t) => sum + (t.commissionSousDistributeur || 0), 0),
        totalCommissionRevendeur: session.transactions.reduce((sum, t) => sum + (t.commissionRevendeur || 0), 0),
        totalCommissionMarchand: session.transactions.reduce((sum, t) => sum + (t.commissionMarchand || 0), 0)
      }))
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des imports:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
