import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ 
        error: 'ID de session requis' 
      }, { status: 400 });
    }

    // Vérifier que la session existe
    const importSession = await prisma.importSession.findUnique({
      where: { id: sessionId },
      include: {
        transactions: true
      }
    });

    if (!importSession) {
      return NextResponse.json({ 
        error: 'Session d\'import non trouvée' 
      }, { status: 404 });
    }

    // Supprimer toutes les transactions liées à cette session
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: {
        importSessionId: sessionId
      }
    });

    // Marquer la session comme annulée
    await prisma.importSession.update({
      where: { id: sessionId },
      data: {
        status: 'CANCELLED',
        importedRows: 0
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Import annulé avec succès',
      deletedTransactions: deletedTransactions.count,
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'import:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
