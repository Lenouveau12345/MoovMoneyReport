export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    console.log('API Stats - Récupération des statistiques...', { startDate, endDate });
    
    // Construire les conditions de filtrage par date
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.transactionInitiatedTime = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }
    
    // Compter le nombre total de transactions (avec filtre de date si fourni)
    const totalTransactions = await prisma.transaction.count({
      where: dateFilter
    });
    
    // Compter le nombre total de sessions d'import (pas de filtre de date pour les imports)
    const totalImportSessions = await prisma.importSession.count();
    
    // Récupérer la dernière session d'import (pas de filtre de date pour les imports)
    const lastImportSession = await prisma.importSession.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        fileName: true,
        totalRows: true,
        importedRows: true,
        status: true,
        createdAt: true,
      }
    });

    console.log('API Stats - Total transactions:', totalTransactions, 'Total imports:', totalImportSessions, 'Date filter:', dateFilter);

    return NextResponse.json({
      totalTransactions,
      totalImportSessions,
      lastImportSession,
    }, { 
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      } 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
