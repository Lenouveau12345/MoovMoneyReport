import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month, year
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculer les dates selon la période
    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date = now;

    if (startDate && endDate) {
      dateFrom = new Date(startDate);
      dateTo = new Date(endDate);
    } else {
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
      },
    });

    // Statistiques par profil
    const transactionsByProfile = await prisma.transaction.groupBy({
      by: ['frProfile', 'toProfile'],
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
      },
    });

    // Évolution quotidienne (pour les graphiques) - Version simplifiée sans SQL brut
    const dailyEvolution: any[] = [];
    
    // Récupérer toutes les transactions de la période
    const allTransactions = await prisma.transaction.findMany({
      where: {
        transactionInitiatedTime: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      select: {
        transactionInitiatedTime: true,
        originalAmount: true,
        fee: true,
      },
    });

    // Grouper par date manuellement
    const dateGroups = new Map();
    allTransactions.forEach(transaction => {
      const date = transaction.transactionInitiatedTime.toISOString().split('T')[0];
      if (!dateGroups.has(date)) {
        dateGroups.set(date, {
          date,
          transactionCount: 0,
          totalAmount: 0,
          totalFees: 0
        });
      }
      const group = dateGroups.get(date);
      group.transactionCount++;
      group.totalAmount += transaction.originalAmount;
      group.totalFees += transaction.fee;
    });

    // Convertir en tableau et trier
    dailyEvolution.push(...Array.from(dateGroups.values()).sort((a, b) => a.date.localeCompare(b.date)));

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
        transactionType: true,
        frmsisdn: true,
        tomsisdn: true,
        transactionInitiatedTime: true,
      },
    });

    return NextResponse.json({
      period,
      dateRange: {
        from: dateFrom,
        to: dateTo,
      },
      summary: {
        totalTransactions,
        totalVolume: totalVolume._sum.originalAmount || 0,
        totalFees: totalFees._sum.fee || 0,
        totalCommissions: totalCommissions._sum.commissionAll || 0,
        averageTransactionAmount: totalTransactions > 0 ? (totalVolume._sum.originalAmount || 0) / totalTransactions : 0,
      },
      breakdown: {
        byType: transactionsByType,
        byProfile: transactionsByProfile,
      },
      evolution: dailyEvolution,
      topTransactions,
    });

  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}
