export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    console.log('Récupération des types de transactions avec comptes...', { startDate, endDate });
    
    // Construire les conditions de filtrage par date
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.transactionInitiatedTime = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }
    
    // Récupérer les types de transactions avec leurs comptes
    const transactionTypesWithCounts = await prisma.transaction.groupBy({
      by: ['transactionType'],
      where: {
        ...dateFilter,
        transactionType: {
          not: null,
          not: ''
        }
      },
      _count: {
        transactionId: true
      },
      _sum: {
        originalAmount: true,
        fee: true,
        commissionAll: true
      },
      _avg: {
        originalAmount: true
      },
      orderBy: {
        _count: {
          transactionId: 'desc'
        }
      }
    });

    // Filtrer les types vides et formater les données
    const formattedTypes = transactionTypesWithCounts
      .filter(item => item.transactionType && item.transactionType.trim() !== '')
      .map(item => ({
        transactionType: item.transactionType || 'Non spécifié',
        count: item._count.transactionId,
        totalAmount: item._sum.originalAmount || 0,
        totalFees: item._sum.fee || 0,
        averageAmount: item._avg.originalAmount || 0,
        totalCommissions: item._sum.commissionAll || 0
      }));

    // Calculer le total général
    const totalTransactions = formattedTypes.reduce((sum, type) => sum + type.count, 0);
    const totalAmount = formattedTypes.reduce((sum, type) => sum + type.totalAmount, 0);
    const totalFees = formattedTypes.reduce((sum, type) => sum + type.totalFees, 0);
    const totalCommissions = formattedTypes.reduce((sum, type) => sum + type.totalCommissions, 0);

    console.log('Types trouvés avec comptes:', formattedTypes.length);
    console.log('Total transactions:', totalTransactions);

    return NextResponse.json({
      transactionTypes: formattedTypes,
      summary: {
        totalTypes: formattedTypes.length,
        totalTransactions,
        totalAmount,
        totalFees,
        totalCommissions
      },
      message: totalTransactions === 0 ? 'Aucune transaction trouvée' : 'Types récupérés avec succès'
    }, { headers: { 'Cache-Control': 'no-store' } });

  } catch (error) {
    console.error('Erreur lors de la récupération des types de transactions avec comptes:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
