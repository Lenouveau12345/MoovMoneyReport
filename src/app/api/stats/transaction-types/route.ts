export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Compter les types de transactions uniques
    const uniqueTypes = await prisma.transaction.findMany({
      select: {
        transactionType: true
      },
      distinct: ['transactionType']
    });

    // Filtrer les valeurs vides
    const validTypes = uniqueTypes
      .map(t => t.transactionType)
      .filter(type => type && type.trim() !== '');

    return NextResponse.json({
      count: validTypes.length,
      types: validTypes // Retourner tous les types pour debug
    }, { headers: { 'Cache-Control': 'no-store' } });

  } catch (error) {
    console.error('Erreur lors du calcul des types de transactions:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      count: 0
    }, { status: 500 });
  }
}
