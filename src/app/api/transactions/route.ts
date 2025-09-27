import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Paramètres de pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Paramètres de filtrage
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const transactionId = searchParams.get('transactionId');
    const frmsisdn = searchParams.get('frmsisdn');
    const tomsisdn = searchParams.get('tomsisdn');
    const frProfile = searchParams.get('frProfile');
    const toProfile = searchParams.get('toProfile');
    const transactionType = searchParams.get('transactionType');
    const search = searchParams.get('search'); // Recherche générale
    const sortBy = searchParams.get('sortBy') || 'transactionInitiatedTime';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Construction des filtres
    const where: any = {};

    // Filtre par date
    if (startDate || endDate) {
      where.transactionInitiatedTime = {};
      if (startDate) {
        where.transactionInitiatedTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.transactionInitiatedTime.lte = new Date(endDate);
      }
    }

    // Filtres spécifiques par colonne (sans mode insensitive pour SQLite)
    if (transactionId) {
      where.transactionId = {
        contains: transactionId
      };
    }

    if (frmsisdn) {
      where.frmsisdn = {
        contains: frmsisdn
      };
    }

    if (tomsisdn) {
      where.tomsisdn = {
        contains: tomsisdn
      };
    }

    if (frProfile) {
      where.frProfile = {
        contains: frProfile
      };
    }

    if (toProfile) {
      where.toProfile = {
        contains: toProfile
      };
    }

    if (transactionType) {
      where.transactionType = {
        contains: transactionType
      };
    }

    // Recherche générale dans tous les champs (seulement si pas de filtres spécifiques)
    if (search && !transactionId && !frmsisdn && !tomsisdn && !frProfile && !toProfile && !transactionType) {
      where.OR = [
        {
          transactionId: {
            contains: search
          }
        },
        {
          frmsisdn: {
            contains: search
          }
        },
        {
          tomsisdn: {
            contains: search
          }
        },
        {
          frProfile: {
            contains: search
          }
        },
        {
          toProfile: {
            contains: search
          }
        },
        {
          transactionType: {
            contains: search
          }
        }
      ];
    }

    // Log pour débogage
    console.log('Filtres appliqués:', JSON.stringify(where, null, 2));
    console.log('Recherche:', search);
    console.log('Transaction ID:', transactionId);

    // Récupération des transactions avec gestion d'erreur
    let transactions, totalCount;
    
    try {
      [transactions, totalCount] = await Promise.all([
        prisma.transaction.findMany({
          where,
          orderBy: {
            [sortBy]: sortOrder
          },
          skip: offset,
          take: limit,
          select: {
            id: true,
            transactionId: true,
            transactionInitiatedTime: true,
            frmsisdn: true,
            tomsisdn: true,
            frProfile: true,
            toProfile: true,
            transactionType: true,
            originalAmount: true,
            fee: true,
            commissionAll: true,
            commissionDistributeur: true,
            commissionSousDistributeur: true,
            commissionRevendeur: true,
            commissionMarchand: true,
            merchantsOnlineCashIn: true,
            createdAt: true,
          }
        }),
        prisma.transaction.count({ where })
      ]);
    } catch (dbError) {
      console.error('Erreur de base de données:', dbError);
      throw new Error(`Erreur de base de données: ${dbError instanceof Error ? dbError.message : 'Erreur inconnue'}`);
    }

    // Statistiques par date (pour les graphiques)
    const dateStats = await prisma.$queryRaw`
      SELECT 
        DATE(transactionInitiatedTime) as date,
        COUNT(*) as transactionCount,
        SUM(originalAmount) as totalAmount,
        SUM(fee) as totalFees,
        SUM(commissionAll) as totalCommissions,
        AVG(originalAmount) as averageAmount
      FROM transactions 
      WHERE ${startDate ? `transactionInitiatedTime >= '${startDate}'` : '1=1'}
        AND ${endDate ? `transactionInitiatedTime <= '${endDate}'` : '1=1'}
      GROUP BY DATE(transactionInitiatedTime)
      ORDER BY date DESC
      LIMIT 30
    `;

    // Statistiques par type de transaction
    const typeStats = await prisma.transaction.groupBy({
      by: ['transactionType'],
      where,
      _count: {
        transactionId: true
      },
      _sum: {
        originalAmount: true,
        fee: true,
        commissionAll: true
      },
      orderBy: {
        _count: {
          transactionId: 'desc'
        }
      }
    });

    return NextResponse.json({
      transactions: transactions.map(t => ({
        ...t,
        originalAmount: Number(t.originalAmount),
        fee: Number(t.fee),
        commissionAll: Number(t.commissionAll),
        commissionDistributeur: t.commissionDistributeur ? Number(t.commissionDistributeur) : null,
        commissionSousDistributeur: t.commissionSousDistributeur ? Number(t.commissionSousDistributeur) : null,
        commissionRevendeur: t.commissionRevendeur ? Number(t.commissionRevendeur) : null,
        commissionMarchand: t.commissionMarchand ? Number(t.commissionMarchand) : null,
      })),
      pagination: {
        page,
        limit,
        total: Number(totalCount),
        totalPages: Math.ceil(Number(totalCount) / limit),
        hasNext: page < Math.ceil(Number(totalCount) / limit),
        hasPrev: page > 1
      },
      stats: {
        dateStats: dateStats.map((item: any) => ({
          ...item,
          transactionCount: Number(item.transactionCount),
          totalAmount: Number(item.totalAmount),
          totalFees: Number(item.totalFees),
          totalCommissions: Number(item.totalCommissions || 0),
          averageAmount: Number(item.averageAmount)
        })),
        typeStats: typeStats.map(item => ({
          transactionType: item.transactionType,
          _count: {
            transactionId: Number(item._count.transactionId)
          },
          _sum: {
            originalAmount: Number(item._sum.originalAmount || 0),
            fee: Number(item._sum.fee || 0),
            commissionAll: Number(item._sum.commissionAll || 0)
          }
        }))
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}
