export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Compter les utilisateurs uniques (numéros de téléphone uniques)
    const uniqueFromUsers = await prisma.transaction.findMany({
      select: {
        frmsisdn: true
      },
      distinct: ['frmsisdn']
    });

    const uniqueToUsers = await prisma.transaction.findMany({
      select: {
        tomsisdn: true
      },
      distinct: ['tomsisdn']
    });

    // Combiner et dédupliquer
    const allUsers = new Set([
      ...uniqueFromUsers.map(u => u.frmsisdn),
      ...uniqueToUsers.map(u => u.tomsisdn)
    ]);

    // Filtrer les valeurs vides
    const validUsers = Array.from(allUsers).filter(user => user && user.trim() !== '');

    return NextResponse.json({
      count: validUsers.length,
      users: validUsers.slice(0, 10) // Retourner les 10 premiers pour debug
    }, { headers: { 'Cache-Control': 'no-store' } });

  } catch (error) {
    console.error('Erreur lors du calcul des utilisateurs uniques:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      count: 0
    }, { status: 500 });
  }
}
