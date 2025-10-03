export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Récupérer toutes les transactions et extraire les profils uniques
    const allTransactions = await prisma.transaction.findMany({
      select: {
        frProfile: true,
        toProfile: true
      },
      take: 10000 // Limiter pour éviter les problèmes de mémoire
    });

    // Extraire les profils uniques
    const frProfileSet = new Set<string>();
    const toProfileSet = new Set<string>();

    allTransactions.forEach(transaction => {
      if (transaction.frProfile && transaction.frProfile.trim() !== '') {
        frProfileSet.add(transaction.frProfile);
      }
      if (transaction.toProfile && transaction.toProfile.trim() !== '') {
        toProfileSet.add(transaction.toProfile);
      }
    });

    // Convertir en tableaux triés
    const frProfiles = Array.from(frProfileSet).sort((a, b) => a.localeCompare(b));
    const toProfiles = Array.from(toProfileSet).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ frProfiles, toProfiles }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des profils:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

 
