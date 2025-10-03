import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('=== TEST CONNEXION DB ===');
    
    // Test de connexion basique
    await prisma.$connect();
    console.log('Connexion DB réussie');
    
    // Test de comptage
    const count = await prisma.transaction.count();
    console.log('Nombre de transactions:', count);
    
    // Test de création d'une session
    const session = await prisma.importSession.create({
      data: {
        fileName: 'test-db.csv',
        fileSize: 100,
        totalRows: 1,
        validRows: 1,
        importedRows: 1,
        status: 'SUCCESS',
      }
    });
    console.log('Session créée:', session.id);
    
    return NextResponse.json({
      message: 'Test DB réussi',
      transactionCount: count,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Erreur test DB:', error);
    return NextResponse.json({ 
      error: 'Erreur test DB',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}