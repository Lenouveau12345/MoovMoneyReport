import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');

    // Calculer les dates selon la période
    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date = now;

    // Si des dates personnalisées sont fournies, les utiliser
    if (dateFromParam && dateToParam) {
      dateFrom = new Date(dateFromParam);
      dateTo = new Date(dateToParam);
    } else {
      // Sinon, calculer selon la période
      switch (period) {
        case 'day':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateFrom = new Date(now);
          dateFrom.setDate(now.getDate() - 7);
          break;
        case 'month':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          dateFrom = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    console.log('Période:', period, 'De:', dateFrom, 'À:', dateTo);

    // Récupérer les statistiques générales
    const totalTransactions = await prisma.transaction.count({
      where: {
        transactionInitiatedTime: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
    });

    const totalVolume = await prisma.transaction.aggregate({
      where: {
        transactionInitiatedTime: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      _sum: {
        originalAmount: true,
      },
    });

    const totalFees = await prisma.transaction.aggregate({
      where: {
        transactionInitiatedTime: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      _sum: {
        fee: true,
      },
    });

    const totalCommissions = await prisma.transaction.aggregate({
      where: {
        transactionInitiatedTime: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      _sum: {
        commissionAll: true,
        commissionDistributeur: true,
        commissionSousDistributeur: true,
        commissionRevendeur: true,
        commissionMarchand: true,
      },
    });

    // Statistiques par type de transaction
    const transactionsByType = await prisma.transaction.groupBy({
      by: ['transactionType'],
      where: {
        transactionInitiatedTime: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      _count: {
        transactionId: true,
      },
      _sum: {
        originalAmount: true,
        fee: true,
        commissionAll: true,
        commissionDistributeur: true,
        commissionSousDistributeur: true,
        commissionRevendeur: true,
        commissionMarchand: true,
      },
    });

    // Top 10 des transactions par montant
    const topTransactions = await prisma.transaction.findMany({
      where: {
        transactionInitiatedTime: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      orderBy: {
        originalAmount: 'desc',
      },
      take: 10,
      select: {
        transactionId: true,
        originalAmount: true,
        fee: true,
        commissionAll: true,
        commissionDistributeur: true,
        commissionSousDistributeur: true,
        commissionRevendeur: true,
        commissionMarchand: true,
        transactionType: true,
        frmsisdn: true,
        tomsisdn: true,
        transactionInitiatedTime: true,
      },
    });

    console.log('Résultats:', {
      totalTransactions,
      totalVolume: totalVolume._sum.originalAmount,
      totalFees: totalFees._sum.fee,
      totalCommissions: totalCommissions._sum.commissionAll,
      transactionsByType: transactionsByType.length,
      topTransactions: topTransactions.length
    });

    return NextResponse.json({
      period,
      dateRange: {
        from: dateFrom,
        to: dateTo,
      },
      summary: {
        totalTransactions: Number(totalTransactions),
        totalVolume: Number(totalVolume._sum.originalAmount || 0),
        totalFees: Number(totalFees._sum.fee || 0),
        totalCommissions: Number(totalCommissions._sum.commissionAll || 0),
        totalCommissionDistributeur: Number(totalCommissions._sum.commissionDistributeur || 0),
        totalCommissionSousDistributeur: Number(totalCommissions._sum.commissionSousDistributeur || 0),
        totalCommissionRevendeur: Number(totalCommissions._sum.commissionRevendeur || 0),
        totalCommissionMarchand: Number(totalCommissions._sum.commissionMarchand || 0),
        averageTransactionAmount: totalTransactions > 0 ? Number(totalVolume._sum.originalAmount || 0) / totalTransactions : 0,
      },
      breakdown: {
        byType: transactionsByType.map(item => ({
          transactionType: item.transactionType,
          _count: {
            transactionId: Number(item._count.transactionId)
          },
          _sum: {
            originalAmount: Number(item._sum.originalAmount || 0),
            fee: Number(item._sum.fee || 0),
            commissionAll: Number(item._sum.commissionAll || 0),
            commissionDistributeur: Number(item._sum.commissionDistributeur || 0),
            commissionSousDistributeur: Number(item._sum.commissionSousDistributeur || 0),
            commissionRevendeur: Number(item._sum.commissionRevendeur || 0),
            commissionMarchand: Number(item._sum.commissionMarchand || 0)
          }
        })),
      },
      topTransactions: topTransactions.map(t => ({
        ...t,
        originalAmount: Number(t.originalAmount),
        fee: Number(t.fee),
        commissionAll: Number(t.commissionAll),
        commissionDistributeur: Number(t.commissionDistributeur || 0),
        commissionSousDistributeur: Number(t.commissionSousDistributeur || 0),
        commissionRevendeur: Number(t.commissionRevendeur || 0),
        commissionMarchand: Number(t.commissionMarchand || 0)
      })),
    });

  } catch (error) {
    console.error('Erreur lors de la génération du rapport simple:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
