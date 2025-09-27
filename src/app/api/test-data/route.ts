import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Vérifier la connexion à la base de données
    const totalTransactions = await prisma.transaction.count();
    
    // Récupérer quelques exemples de transactions
    const sampleTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: {
        originalAmount: 'desc'
      },
      select: {
        transactionId: true,
        originalAmount: true,
        fee: true,
        transactionType: true,
        transactionInitiatedTime: true
      }
    });

    // Récupérer les types de transactions uniques
    const transactionTypes = await prisma.transaction.groupBy({
      by: ['transactionType'],
      _count: {
        transactionId: true
      },
      _sum: {
        originalAmount: true
      }
    });

    // Calculer les statistiques de base
    const totalVolume = await prisma.transaction.aggregate({
      _sum: {
        originalAmount: true
      }
    });

    const totalFees = await prisma.transaction.aggregate({
      _sum: {
        fee: true
      }
    });

    return NextResponse.json({
      success: true,
      databaseStatus: 'Connected',
      totalTransactions,
      totalVolume: totalVolume._sum.originalAmount || 0,
      totalFees: totalFees._sum.fee || 0,
      sampleTransactions: sampleTransactions.map(t => ({
        ...t,
        originalAmount: Number(t.originalAmount),
        fee: Number(t.fee)
      })),
      transactionTypes: transactionTypes.map(t => ({
        type: t.transactionType,
        count: t._count.transactionId,
        volume: Number(t._sum.originalAmount || 0)
      })),
      message: 'Base de données fonctionnelle avec des données réelles'
    });

  } catch (error) {
    console.error('Erreur lors du test de la base de données:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur de base de données',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
