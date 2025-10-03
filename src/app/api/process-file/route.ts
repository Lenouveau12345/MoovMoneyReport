import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProcessResult {
  fileId: string;
  totalRows: number;
  validTransactions: number;
  insertedTransactions: number;
  duplicatesSkipped: number;
  errors: string[];
  importSessionId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: 'ID de fichier manquant' }, { status: 400 });
    }

    console.log('=== TRAITEMENT FICHIER ===');
    console.log('File ID:', fileId);

    // Récupérer le fichier depuis la DB
    const uploadedFile = await prisma.uploadedFile.findUnique({
      where: { id: fileId }
    });

    if (!uploadedFile) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    if (uploadedFile.status !== 'UPLOADED') {
      return NextResponse.json({ error: 'Fichier déjà traité ou en cours de traitement' }, { status: 400 });
    }

    // Vérifier que le fichier existe sur le disque
    if (!existsSync(uploadedFile.filePath)) {
      return NextResponse.json({ error: 'Fichier non trouvé sur le disque' }, { status: 404 });
    }

    console.log('Traitement du fichier:', uploadedFile.originalName);

    // Marquer le fichier comme en cours de traitement
    await prisma.uploadedFile.update({
      where: { id: fileId },
      data: { status: 'PROCESSING' }
    });

    // Créer une session d'import
    const importSession = await prisma.importSession.create({
      data: {
        fileName: uploadedFile.originalName,
        fileSize: uploadedFile.fileSize,
        totalRows: 0,
        validRows: 0,
        importedRows: 0,
        status: 'SUCCESS',
      }
    });

    // Lier le fichier à la session d'import
    await prisma.uploadedFile.update({
      where: { id: fileId },
      data: { 
        importSessionId: importSession.id,
        processedAt: new Date()
      }
    });

    // Lire et traiter le fichier
    const csvContent = await readFile(uploadedFile.filePath, 'utf-8');
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
    let duplicatesSkipped = 0;
    const errors: string[] = [];
    const transactionsToInsert = [];
    const seenTransactionIds = new Set<string>();

    // Traiter chaque ligne de données
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      totalRows++;
      
      try {
        const values = line.split(',').map(v => v.trim());
        
        // Générer un ID unique pour éviter les doublons
        const baseTransactionId = values[0] || `IMPORT_${Date.now()}_${i}`;
        let transactionId = baseTransactionId;
        let counter = 1;
        
        // Vérifier l'unicité dans le fichier en cours
        while (seenTransactionIds.has(transactionId)) {
          transactionId = `${baseTransactionId}_${counter}`;
          counter++;
        }
        seenTransactionIds.add(transactionId);

        // Créer un objet transaction
        const transaction = {
          transactionId: transactionId,
          transactionInitiatedTime: new Date(),
          frmsisdn: values[2] || '225000000000',
          tomsisdn: values[3] || '225000000000',
          frProfile: values[4] || 'IMPORT',
          toProfile: values[5] || 'IMPORT',
          transactionType: values[6] || 'Import Transaction',
          originalAmount: parseFloat(values[7]) || 100,
          fee: parseFloat(values[8]) || 0,
          commissionAll: parseFloat(values[9]) || 0,
          merchantsOnlineCashIn: '',
          importSessionId: importSession.id,
        };

        transactionsToInsert.push(transaction);
        validTransactions++;

        // Insérer par batch de 1000
        if (transactionsToInsert.length >= 1000) {
          try {
            const result = await prisma.transaction.createMany({
              data: transactionsToInsert
            });
            insertedTransactions += result.count || 0;
            duplicatesSkipped += transactionsToInsert.length - (result.count || 0);
            transactionsToInsert.length = 0; // Vider le tableau
            
            console.log(`Batch inséré: ${result.count} transactions, ${duplicatesSkipped} doublons ignorés`);
          } catch (error) {
            console.error('Erreur insertion batch:', error);
            errors.push(`Erreur batch ligne ${i}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          }
        }

      } catch (error) {
        console.error(`Erreur ligne ${i}:`, error);
        errors.push(`Ligne ${i}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }

    // Insérer le dernier batch
    if (transactionsToInsert.length > 0) {
      try {
        const result = await prisma.transaction.createMany({
          data: transactionsToInsert
        });
        insertedTransactions += result.count || 0;
        duplicatesSkipped += transactionsToInsert.length - (result.count || 0);
        console.log(`Dernier batch inséré: ${result.count} transactions, ${duplicatesSkipped} doublons ignorés`);
      } catch (error) {
        console.error('Erreur insertion dernier batch:', error);
        errors.push(`Erreur dernier batch: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
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

    // Marquer le fichier comme traité
    await prisma.uploadedFile.update({
      where: { id: fileId },
      data: { status: 'PROCESSED' }
    });

    const result: ProcessResult = {
      fileId,
      totalRows,
      validTransactions,
      insertedTransactions,
      errors,
      importSessionId: importSession.id,
      duplicatesSkipped,
    };

    console.log('=== TRAITEMENT TERMINÉ ===');
    console.log('Résultat:', result);

    return NextResponse.json({
      message: 'Fichier traité avec succès',
      ...result,
    });

  } catch (error) {
    console.error('=== ERREUR TRAITEMENT FICHIER ===');
    console.error('Message:', error instanceof Error ? error.message : error);
    
    // Marquer le fichier comme échoué
    if (fileId) {
      try {
        await prisma.uploadedFile.update({
          where: { id: fileId },
          data: { status: 'FAILED' }
        });
      } catch (updateError) {
        console.error('Erreur mise à jour statut fichier:', updateError);
      }
    }
    
    return NextResponse.json({ 
      error: 'Erreur lors du traitement du fichier',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (fileId) {
      // Récupérer les détails d'un fichier spécifique
      const file = await prisma.uploadedFile.findUnique({
        where: { id: fileId },
        include: { importSession: true }
      });

      if (!file) {
        return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
      }

      return NextResponse.json({ file });
    } else {
      // Récupérer tous les fichiers avec leur statut
      const files = await prisma.uploadedFile.findMany({
        include: { importSession: true },
        orderBy: { uploadedAt: 'desc' },
        take: 50,
      });

      return NextResponse.json({ files });
    }

  } catch (error) {
    console.error('Erreur récupération fichiers:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des fichiers',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
