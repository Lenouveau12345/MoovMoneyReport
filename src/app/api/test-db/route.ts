import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Test de la base de données...');

    // Test de connexion
    const connectionTest = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Test de connexion:', connectionTest);

    // Compter les transactions
    const totalCount = await prisma.transaction.count();
    console.log('Total transactions:', totalCount);

    // Récupérer quelques exemples
    const sampleTransactions = await prisma.transaction.findMany({
      take: 5,
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

    console.log('Exemples de transactions:', sampleTransactions);

    // Test de recherche simple
    const searchTest = await prisma.transaction.findMany({
      where: {
        transactionId: {
          contains: 'CE'
        }
      },
      take: 3,
      select: {
        transactionId: true
      }
    });

    console.log('Recherche "CE":', searchTest);

    return NextResponse.json({
      success: true,
      connectionTest,
      totalTransactions: Number(totalCount),
      sampleTransactions: sampleTransactions.map(t => ({
        ...t,
        originalAmount: Number(t.originalAmount)
      })),
      searchTest: searchTest.map(t => ({
        transactionId: t.transactionId
      })),
      message: 'Base de données fonctionnelle'
    });

  } catch (error) {
    console.error('Erreur lors du test de la base de données:', error);
    return NextResponse.json({ 
      error: 'Erreur de base de données',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
