import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Readable } from 'stream';
import { parse } from 'csv-parse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Configuration pour les gros fichiers
const BATCH_SIZE = 1000; // Augmenter la taille des lots
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB max
const MAX_ROWS = 2000000; // 2 millions de lignes max

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `Fichier trop volumineux. Taille maximale: ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    // Vérifier que c'est un fichier CSV
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Le fichier doit être un CSV' }, { status: 400 });
    }

    console.log('=== DÉBUT IMPORT STREAMING ===');
    console.log('Fichier:', file.name);
    console.log('Taille:', file.size, 'bytes');
    console.log('Taille max autorisée:', MAX_FILE_SIZE, 'bytes');

    // Compter les transactions existantes avant l'import
    const existingCount = await prisma.transaction.count();
    console.log('Transactions existantes dans la base:', existingCount);

    // Créer une session d'import
    const importSession = await prisma.importSession.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        totalRows: 0, // Sera mis à jour
        validRows: 0,
        importedRows: 0,
        status: 'SUCCESS',
      }
    });

    // Convertir le fichier en stream
    const stream = Readable.fromWeb(file.stream() as any);
    
    // Parser le CSV en streaming
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let rowCount = 0;
    let validCount = 0;
    let insertedCount = 0;
    let batch = [];
    let headers: string[] = [];

    return new Promise((resolve, reject) => {
      parser.on('readable', async function() {
        let record;
        while ((record = parser.read()) !== null) {
          rowCount++;
          
          // Vérifier la limite de lignes
          if (rowCount > MAX_ROWS) {
            console.log(`Limite de ${MAX_ROWS} lignes atteinte, arrêt du traitement`);
            break;
          }

          // Capturer les headers
          if (rowCount === 1) {
            headers = Object.keys(record);
            console.log('Headers détectés:', headers);
          }

          // Valider la ligne
          if (isValidTransaction(record)) {
            validCount++;
            batch.push(transformTransaction(record, importSession.id));

            // Traiter le lot quand il est plein
            if (batch.length >= BATCH_SIZE) {
              try {
                const inserted = await processBatch(batch);
                insertedCount += inserted;
                batch = [];
                
                // Log du progrès
                const progress = Math.round((rowCount / MAX_ROWS) * 100);
                console.log(`Progrès: ${rowCount} lignes traitées, ${insertedCount} transactions insérées (${progress}%)`);
              } catch (error) {
                console.error('Erreur lors du traitement du lot:', error);
                reject(error);
                return;
              }
            }
          }
        }
      });

      parser.on('end', async function() {
        try {
          // Traiter le dernier lot
          if (batch.length > 0) {
            const inserted = await processBatch(batch);
            insertedCount += inserted;
          }

          // Mettre à jour la session d'import
          await prisma.importSession.update({
            where: { id: importSession.id },
            data: {
              totalRows: rowCount,
              validRows: validCount,
              importedRows: insertedCount,
              status: insertedCount === validCount ? 'SUCCESS' : 'PARTIAL',
            }
          });

          const finalCount = await prisma.transaction.count();
          console.log('=== FIN IMPORT STREAMING ===');
          console.log('Lignes traitées:', rowCount);
          console.log('Transactions valides:', validCount);
          console.log('Transactions insérées:', insertedCount);
          console.log('Total final:', finalCount);

          resolve(NextResponse.json({
            message: 'Fichier CSV importé avec succès (mode streaming)',
            importSessionId: importSession.id,
            totalRows: rowCount,
            validTransactions: validCount,
            insertedTransactions: insertedCount,
            existingTransactions: existingCount,
            finalTransactions: finalCount,
            newTransactionsAdded: finalCount - existingCount,
            duplicatesIgnored: validCount - insertedCount,
          }));
        } catch (error) {
          console.error('Erreur lors de la finalisation:', error);
          reject(error);
        }
      });

      parser.on('error', function(error) {
        console.error('Erreur du parser CSV:', error);
        reject(error);
      });

      // Connecter le stream au parser
      stream.pipe(parser);
    });

  } catch (error) {
    console.error('Erreur lors de l\'import CSV streaming:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// Fonction pour valider une transaction
function isValidTransaction(record: any): boolean {
  const requiredFields = ['transactionId', 'transactionInitiatedTime', 'frmsisdn', 'tomsisdn'];
  return requiredFields.every(field => record[field] && record[field].trim() !== '');
}

// Fonction pour transformer une transaction
function transformTransaction(record: any, importSessionId: string) {
  return {
    transactionId: record.transactionId?.trim(),
    transactionInitiatedTime: new Date(record.transactionInitiatedTime),
    frmsisdn: record.frmsisdn?.trim(),
    tomsisdn: record.tomsisdn?.trim(),
    frProfile: record.frProfile?.trim() || '',
    toProfile: record.toProfile?.trim() || '',
    transactionType: record.transactionType?.trim() || '',
    originalAmount: parseFloat(record.originalAmount) || 0,
    fee: parseFloat(record.fee) || 0,
    commissionAll: parseFloat(record.commissionAll) || 0,
    merchantsOnlineCashIn: record.merchantsOnlineCashIn?.trim() || '',
    importSessionId: importSessionId,
    commissionDistributeur: parseFloat(record.commissionDistributeur) || 0,
    commissionMarchand: parseFloat(record.commissionMarchand) || 0,
    commissionRevendeur: parseFloat(record.commissionRevendeur) || 0,
    commissionSousDistributeur: parseFloat(record.commissionSousDistributeur) || 0,
  };
}

// Fonction pour traiter un lot de transactions
async function processBatch(batch: any[]): Promise<number> {
  let insertedCount = 0;
  
  for (const transaction of batch) {
    try {
      // Vérifier si la transaction existe déjà
      const existingTransaction = await prisma.transaction.findFirst({
        where: { 
          transactionId: transaction.transactionId,
          importSessionId: importSession.id
        }
      });

      if (!existingTransaction) {
        await prisma.transaction.create({
          data: transaction,
        });
        insertedCount++;
      }
    } catch (error) {
      console.error('Erreur lors de l\'insertion de la transaction:', error);
    }
  }
  
  return insertedCount;
}
