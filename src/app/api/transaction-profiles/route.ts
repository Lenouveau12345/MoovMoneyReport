import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Récupérer les profils uniques pour FRPROFILE
    const frProfilesResult = await prisma.transaction.groupBy({
      by: ['frProfile'],
      where: {
        frProfile: {
          not: null,
          not: ''
        }
      },
      orderBy: {
        frProfile: 'asc'
      }
    });

    // Récupérer les profils uniques pour TOPROFILE
    const toProfilesResult = await prisma.transaction.groupBy({
      by: ['toProfile'],
      where: {
        toProfile: {
          not: null,
          not: ''
        }
      },
      orderBy: {
        toProfile: 'asc'
      }
    });

    const frProfiles = frProfilesResult.map(item => item.frProfile).filter(Boolean);
    const toProfiles = toProfilesResult.map(item => item.toProfile).filter(Boolean);

    console.log('Profils FR récupérés:', frProfiles);
    console.log('Profils TO récupérés:', toProfiles);

    return NextResponse.json({
      frProfiles,
      toProfiles
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des profils:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des profils' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
