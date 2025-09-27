import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Récupération des types de transactions...');
    
    // Utiliser la même méthode que l'API stats/transaction-types qui fonctionne
    const uniqueTypes = await prisma.transaction.findMany({
      select: {
        transactionType: true
      },
      distinct: ['transactionType']
    });

    // Filtrer les valeurs vides et trier
    const types = uniqueTypes
      .map(t => t.transactionType)
      .filter(type => type && type.trim() !== '')
      .sort();

    console.log('Types trouvés:', types);

    // Compter le total des transactions
    const totalCount = await prisma.transaction.count();

    return NextResponse.json({
      transactionTypes: types,
      count: types.length,
      totalTransactions: totalCount,
      message: totalCount === 0 ? 'Aucune transaction trouvée. Importez d\'abord des données CSV.' : 'Types récupérés avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des types de transactions:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
