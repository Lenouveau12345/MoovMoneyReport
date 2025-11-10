export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    console.log('Récupération des statistiques des profils...', { startDate, endDate });
    
    // Construire les conditions de filtrage par date
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.transactionInitiatedTime = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }
    
    // Construire la condition WHERE pour FRPROFILE
    const frWhere: any = {
      ...dateFilter,
      frProfile: {
        not: ''
      }
    };
    
    // Récupérer les statistiques pour FRPROFILE
    const frProfileStats = await prisma.transaction.groupBy({
      by: ['frProfile'],
      where: frWhere,
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

    // Construire la condition WHERE pour TOPROFILE
    const toWhere: any = {
      ...dateFilter,
      toProfile: {
        not: ''
      }
    };
    
    // Récupérer les statistiques pour TOPROFILE
    const toProfileStats = await prisma.transaction.groupBy({
      by: ['toProfile'],
      where: toWhere,
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

    // Calculer les totaux avec le même filtre de date
    const totalTransactions = await prisma.transaction.count({
      where: dateFilter
    });
    const totalAmount = await prisma.transaction.aggregate({
      where: dateFilter,
      _sum: {
        originalAmount: true
      }
    });

    // Filtrer les résultats pour exclure NULL et les valeurs vides
    const frProfileData = frProfileStats
      .filter(stat => stat.frProfile && stat.frProfile.trim() !== '')
      .map(stat => ({
        profile: stat.frProfile,
        count: stat._count.transactionId,
        totalAmount: stat._sum.originalAmount || 0,
        totalFees: stat._sum.fee || 0,
        totalCommissions: stat._sum.commissionAll || 0,
        percentage: totalTransactions > 0 ? (stat._count.transactionId / totalTransactions) * 100 : 0
      }));

    const toProfileData = toProfileStats
      .filter(stat => stat.toProfile && stat.toProfile.trim() !== '')
      .map(stat => ({
        profile: stat.toProfile,
        count: stat._count.transactionId,
        totalAmount: stat._sum.originalAmount || 0,
        totalFees: stat._sum.fee || 0,
        totalCommissions: stat._sum.commissionAll || 0,
        percentage: totalTransactions > 0 ? (stat._count.transactionId / totalTransactions) * 100 : 0
      }));

    return NextResponse.json({
      frProfiles: frProfileData,
      toProfiles: toProfileData,
      summary: {
        totalTransactions,
        totalAmount: totalAmount._sum.originalAmount || 0,
        uniqueFrProfiles: frProfileData.length,
        uniqueToProfiles: toProfileData.length
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des profils:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Détails de l\'erreur:', { errorMessage, errorStack });
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des statistiques des profils',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
