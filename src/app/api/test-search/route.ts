import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('q') || 'CE271D443R';

    // Test de recherche directe
    const directSearch = await prisma.transaction.findMany({
      where: {
        transactionId: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      take: 5
    });

    // Test de recherche dans tous les champs
    const globalSearch = await prisma.transaction.findMany({
      where: {
        OR: [
          {
            transactionId: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            frmsisdn: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            tomsisdn: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        ]
      },
      take: 5
    });

    // Compter le total
    const totalCount = await prisma.transaction.count();

    // Récupérer quelques exemples de transactionId
    const sampleIds = await prisma.transaction.findMany({
      select: {
        transactionId: true
      },
      take: 10
    });

    return NextResponse.json({
      searchTerm,
      totalTransactions: totalCount,
      directSearchResults: directSearch.length,
      globalSearchResults: globalSearch.length,
      directSearch: directSearch,
      globalSearch: globalSearch,
      sampleIds: sampleIds.map(t => t.transactionId)
    });

  } catch (error) {
    console.error('Erreur lors du test de recherche:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
