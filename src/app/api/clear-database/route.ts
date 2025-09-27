import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
  try {
    console.log('Début de la suppression de toutes les données...');

    // Compter les transactions avant suppression
    const countBefore = await prisma.transaction.count();
    console.log(`Nombre de transactions avant suppression: ${countBefore}`);

    // Supprimer toutes les transactions
    const deleteResult = await prisma.transaction.deleteMany({});
    
    console.log(`Nombre de transactions supprimées: ${deleteResult.count}`);

    // Vérifier que la base est vide
    const countAfter = await prisma.transaction.count();
    console.log(`Nombre de transactions après suppression: ${countAfter}`);

    return NextResponse.json({
      success: true,
      message: 'Base de données vidée avec succès',
      deletedCount: deleteResult.count,
      countBefore,
      countAfter
    });

  } catch (error) {
    console.error('Erreur lors de la suppression des données:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression des données',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// Méthode GET pour vérifier l'état de la base
export async function GET() {
  try {
    const totalTransactions = await prisma.transaction.count();
    
    return NextResponse.json({
      totalTransactions,
      isEmpty: totalTransactions === 0,
      message: totalTransactions === 0 ? 'Base de données vide' : `${totalTransactions} transactions dans la base`
    });

  } catch (error) {
    console.error('Erreur lors de la vérification de la base:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la vérification de la base',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
