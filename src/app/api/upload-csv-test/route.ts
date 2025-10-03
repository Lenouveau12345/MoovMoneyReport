export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DÉBUT TEST IMPORT ===');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log('Fichier reçu:', file ? file.name : 'AUCUN');

    if (!file) {
      console.log('Erreur: Aucun fichier fourni');
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Le fichier doit être un CSV' }, { status: 400 });
    }

    console.log('=== TEST IMPORT SIMPLE ===');
    console.log('Fichier:', file.name);
    console.log('Taille:', file.size, 'bytes');

    // Compter les transactions existantes
    const existingCount = await prisma.transaction.count();
    console.log('Transactions existantes:', existingCount);

    // Créer une session d'import
    const importSession = await prisma.importSession.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        totalRows: 0,
        validRows: 0,
        importedRows: 0,
        status: 'SUCCESS',
      }
    });

    // Lire le fichier en entier (pour les petits fichiers)
    const csvContent = await file.text();
    console.log('Contenu CSV (premiers 500 chars):', csvContent.substring(0, 500));
    
    // Parser ligne par ligne
    const lines = csvContent.split(/\r?\n/);
    console.log('Nombre de lignes:', lines.length);
    
    if (lines.length < 2) {
      throw new Error('Fichier CSV vide ou sans données');
    }

    // Première ligne = en-têtes
    const headers = lines[0].split(',').map(h => h.trim());
    console.log('En-têtes:', headers);

    let totalRows = 0;
    let validTransactions = 0;
    let insertedTransactions = 0;
    const transactionsToInsert = [];

    // Traiter chaque ligne de données
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      totalRows++;
      
      try {
        const values = line.split(',').map(v => v.trim());
        
        // Créer un objet transaction basique
        const transaction = {
          transactionId: values[0] || `TEST_${Date.now()}_${i}`,
          transactionInitiatedTime: new Date(),
          frmsisdn: values[2] || '225000000000',
          tomsisdn: values[3] || '225000000000',
          frProfile: values[4] || 'TEST',
          toProfile: values[5] || 'TEST',
          transactionType: values[6] || 'Test Transaction',
          originalAmount: parseFloat(values[7]) || 100,
          fee: parseFloat(values[8]) || 0,
          commissionAll: parseFloat(values[9]) || 0,
          merchantsOnlineCashIn: '',
          importSessionId: importSession.id,
        };

        transactionsToInsert.push(transaction);
        validTransactions++;

        console.log(`Ligne ${i}: Transaction créée:`, transaction.transactionId);

      } catch (error) {
        console.error(`Erreur ligne ${i}:`, error);
      }
    }

    console.log(`Transactions à insérer: ${transactionsToInsert.length}`);

    // Insérer toutes les transactions en une fois
    if (transactionsToInsert.length > 0) {
      const result = await prisma.transaction.createMany({
        data: transactionsToInsert,
        skipDuplicates: true
      });
      insertedTransactions = result.count || 0;
      console.log(`Transactions insérées: ${insertedTransactions}`);
    }

    // Mettre à jour la session d'import
    await prisma.importSession.update({
      where: { id: importSession.id },
      data: {
        totalRows,
        validRows: validTransactions,
        importedRows: insertedTransactions,
        status: insertedTransactions > 0 ? 'SUCCESS' : 'FAILED',
      }
    });

    const finalCount = await prisma.transaction.count();
    console.log('Total transactions après import:', finalCount);

    return NextResponse.json({
      message: 'Import test terminé',
      importSessionId: importSession.id,
      totalRows,
      validTransactions,
      insertedTransactions,
      existingTransactions: existingCount,
      finalTransactions: finalCount,
      newTransactionsAdded: finalCount - existingCount,
    });

  } catch (error) {
    console.error('=== ERREUR IMPORT TEST ===');
    console.error('Type d\'erreur:', typeof error);
    console.error('Message:', error instanceof Error ? error.message : error);
    console.error('Stack:', error instanceof Error ? error.stack : 'Pas de stack');
    return NextResponse.json({ 
      error: 'Erreur lors de l\'import test',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
