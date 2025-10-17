import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Readable } from 'stream';
import { parse } from 'csv-parse';

export const revalidate = 0;
export const maxDuration = 300; // 5 minutes max pour les très gros fichiers

// Configuration ultra-optimisée pour très gros fichiers
const BATCH_SIZE = 5000; // Batchs moyens pour équilibrer mémoire/performance
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB max
const MAX_ROWS = 5000000; // 5 millions de lignes max

// Fonction de validation simplifiée
function isValidTransaction(row: any): boolean {
  return row && 
    (row['Transaction ID'] || row['transactionId'] || row['ID'] || row['id']) && 
    (row['FRMSISDN'] || row['frmsisdn'] || row['from'] || row['From']) &&
    (row['TOMSISDN'] || row['tomsisdn'] || row['to'] || row['To']);
}

// Fonction de transformation optimisée
function transformTransaction(row: any, sessionId: string) {
  const toNumber = (value: any) => {
    if (!value) return 0;
    const num = Number(String(value).replace(/\s/g, '').replace(/,/g, '.'));
    return Number.isFinite(num) ? num : 0;
  };

  const toDate = (value: any) => {
    if (!value) return new Date();
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : new Date();
  };

  return {
    transactionId: row['Transaction ID'] || row['transactionId'] || row['ID'] || row['id'] || '',
    transactionInitiatedTime: toDate(row['Transaction Initiated Time'] || row['transactionInitiatedTime'] || row['date'] || row['Date']),
    frmsisdn: row['FRMSISDN'] || row['frmsisdn'] || row['from'] || row['From'] || '',
    tomsisdn: row['TOMSISDN'] || row['tomsisdn'] || row['to'] || row['To'] || '',
    frName: row['FR_NAME'] || row['frName'] || row['fromName'] || null,
    toName: row['TO_NAME'] || row['toName'] || row['toName'] || null,
    frProfile: row['FR_PROFILE'] || row['frProfile'] || row['fromProfile'] || '',
    toProfile: row['TO_PROFILE'] || row['toProfile'] || row['toProfile'] || '',
    transactionType: row['Transaction Type'] || row['transactionType'] || row['type'] || '',
    originalAmount: toNumber(row['Original Amount'] || row['originalAmount'] || row['amount'] || row['Amount']),
    fee: toNumber(row['Fee'] || row['fee'] || row['Fees']),
    commissionAll: toNumber(row['Commission ALL'] || row['commissionAll'] || row['commission'] || row['Commission']),
    merchantsOnlineCashIn: row['MSISDN_MARCHAND'] || row['merchantsOnlineCashIn'] || row['merchant'] || '',
    importSessionId: sessionId,
  };
}

export async function POST(request: NextRequest) {
  let importSessionId: string | null = null;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Le fichier doit être un CSV' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `Fichier trop volumineux. Taille maximale: ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB` 
      }, { status: 400 });
    }

    console.log('=== DÉBUT IMPORT MEGA ===');
    console.log('Fichier:', file.name);
    console.log('Taille:', file.size, 'bytes');

    // Compter les transactions existantes
    const existingCount = await prisma.transaction.count();

    // Créer une session d'import
    const importSession = await prisma.importSession.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        totalRows: 0,
        validRows: 0,
        importedRows: 0,
        status: 'PARTIAL',
      }
    });
    importSessionId = importSession.id;

    let rowCount = 0;
    let validCount = 0;
    let insertedCount = 0;
    let duplicatesIgnored = 0;
    const transactionsToInsert: any[] = [];

    // Convertir le fichier en stream (vrai streaming)
    const fileStream = Readable.fromWeb(file.stream() as any);

    const parser = fileStream.pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }));

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

          // Valider la ligne
          if (isValidTransaction(record)) {
            validCount++;
            const transformed = transformTransaction(record, importSessionId!);
            transactionsToInsert.push(transformed);

            // Log de debug pour les premières lignes
            if (validCount <= 5) {
              console.log(`Ligne valide ${validCount}:`, {
                transactionId: transformed.transactionId,
                frmsisdn: transformed.frmsisdn,
                tomsisdn: transformed.tomsisdn,
                amount: transformed.originalAmount
              });
            }

            // Traiter le lot quand il est plein
            if (transactionsToInsert.length >= BATCH_SIZE) {
              try {
                const result = await prisma.transaction.createMany({
                  data: transactionsToInsert,
                  skipDuplicates: true,
                });
                
                const insertedNow = result.count ?? 0;
                insertedCount += insertedNow;
                duplicatesIgnored += (transactionsToInsert.length - insertedNow);
                transactionsToInsert.length = 0; // Vider le tableau

                // Log du progrès toutes les 50k lignes
                if (rowCount % 50000 === 0) {
                  console.log(`Progrès: ${rowCount.toLocaleString()} lignes traitées, ${insertedCount.toLocaleString()} transactions insérées`);
                }
              } catch (error) {
                console.error('Erreur lors du traitement du batch:', error);
                reject(error);
                return;
              }
            }
          }
        }
      });

      parser.on('end', async function() {
        try {
          // Traiter le dernier batch
          if (transactionsToInsert.length > 0) {
            const result = await prisma.transaction.createMany({
              data: transactionsToInsert,
              skipDuplicates: true,
            });
            
            const insertedNow = result.count ?? 0;
            insertedCount += insertedNow;
            duplicatesIgnored += (transactionsToInsert.length - insertedNow);
          }

          // Mettre à jour la session d'import
          await prisma.importSession.update({
            where: { id: importSessionId! },
            data: {
              totalRows: rowCount,
              validRows: validCount,
              importedRows: insertedCount,
              status: 'SUCCESS',
              updatedAt: new Date(),
            }
          });

          const finalCount = await prisma.transaction.count();
          const newTransactionsAdded = finalCount - existingCount;

          console.log('=== FIN IMPORT MEGA ===');
          console.log(`Lignes traitées: ${rowCount.toLocaleString()}`);
          console.log(`Transactions valides: ${validCount.toLocaleString()}`);
          console.log(`Nouvelles transactions ajoutées: ${newTransactionsAdded.toLocaleString()}`);
          console.log(`Doublons ignorés: ${duplicatesIgnored.toLocaleString()}`);

          resolve(NextResponse.json({
            message: 'Import mega réussi',
            importSessionId: importSessionId,
            totalRows: rowCount,
            validTransactions: validCount,
            insertedTransactions: insertedCount,
            existingTransactions: existingCount,
            finalTransactions: finalCount,
            newTransactionsAdded: newTransactionsAdded,
            duplicatesIgnored: duplicatesIgnored,
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
    });

  } catch (error: any) {
    console.error('Erreur lors de l\'import mega:', error);
    
    // Mettre à jour la session en cas d'erreur
    if (importSessionId) {
      try {
        await prisma.importSession.update({
          where: { id: importSessionId },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
            updatedAt: new Date(),
          }
        });
      } catch (updateError) {
        console.error('Erreur lors de la mise à jour de la session:', updateError);
      }
    }

    return NextResponse.json({ 
      error: error.message || 'Erreur lors de l\'import mega' 
    }, { status: 500 });
  }
}
