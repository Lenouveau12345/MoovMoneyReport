import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    console.log('Recherche simple pour:', search);

    // Test simple - récupérer toutes les transactions d'abord
    const allTransactions = await prisma.transaction.findMany({
      take: 10,
      select: {
        id: true,
        transactionId: true,
        frmsisdn: true,
        tomsisdn: true,
        transactionType: true,
        originalAmount: true,
      }
    });

    console.log('Transactions trouvées:', allTransactions.length);
    console.log('Exemples d\'IDs:', allTransactions.map(t => t.transactionId));

    // Si pas de recherche, retourner les 10 premières
    if (!search) {
      return NextResponse.json({
        transactions: allTransactions,
        total: allTransactions.length,
        message: 'Pas de recherche spécifiée'
      });
    }

    // Recherche simple
    const searchResults = await prisma.transaction.findMany({
      where: {
        transactionId: {
          contains: search,
          mode: 'insensitive'
        }
      },
      take: 20,
      select: {
        id: true,
        transactionId: true,
        frmsisdn: true,
        tomsisdn: true,
        transactionType: true,
        originalAmount: true,
        transactionInitiatedTime: true,
      }
    });

    console.log('Résultats de recherche:', searchResults.length);

    return NextResponse.json({
      search,
      transactions: searchResults.map(t => ({
        ...t,
        originalAmount: Number(t.originalAmount)
      })),
      total: searchResults.length,
      allSampleIds: allTransactions.map(t => t.transactionId)
    });

  } catch (error) {
    console.error('Erreur dans l\'API simple:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
