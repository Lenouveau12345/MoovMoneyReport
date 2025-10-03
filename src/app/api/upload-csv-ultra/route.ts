import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { parse } from 'csv-parse';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Configuration ultra-optimisée
const BATCH_SIZE = 10000; // 10k lignes par batch comme suggéré
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB max
const MAX_ROWS = 10000000; // 10 millions de lignes max


export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `Fichier trop volumineux. Taille maximale: ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB` 
      }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Le fichier doit être un CSV' }, { status: 400 });
    }

    console.log('=== DÉBUT IMPORT ULTRA-RAPIDE ===');
    console.log('Fichier:', file.name);
    console.log('Taille:', file.size, 'bytes');
    console.log('Taille max autorisée:', MAX_FILE_SIZE, 'bytes');

    // Compter les transactions existantes (Neon)
    const existingCount = await prisma.transaction.count();
    console.log('Transactions existantes:', existingCount);

    // Créer une session d'import (Neon)
    const session = await prisma.importSession.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        totalRows: 0,
        validRows: 0,
        importedRows: 0,
        status: 'SUCCESS',
      }
    });
    const sessionId = session.id;

    // Fonction d'insertion par lots (Neon)
    const insertMany = async (transactions: any[]) => {
      const result = await prisma.transaction.createMany({ data: transactions, skipDuplicates: true });
      return result.count ?? 0;
    };

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
    let batch: any[] = [];
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
            batch.push(transformTransaction(record, sessionId));
            
            // Log de debug pour les premières lignes
            if (validCount <= 5) {
              console.log(`Ligne valide ${validCount}:`, {
                transactionId: record['Transaction ID'],
                frmsisdn: record['FRMSISDN'],
                tomsisdn: record['TOMSISDN'],
                amount: record['Original Amount']
              });
            }

            // Traiter le batch quand il est plein
            if (batch.length >= BATCH_SIZE) {
              try {
                const insertedNow = await insertMany(batch);
                insertedCount += insertedNow;
                batch = [];
                
                // Log du progrès toutes les 100k lignes
                if (rowCount % 100000 === 0) {
                  const elapsed = (Date.now() - startTime) / 1000;
                  const rate = rowCount / elapsed;
                  console.log(`Progrès: ${rowCount.toLocaleString()} lignes traitées en ${elapsed.toFixed(1)}s (${rate.toFixed(0)} lignes/s)`);
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
          if (batch.length > 0) {
            const insertedNow = await insertMany(batch);
            insertedCount += insertedNow;
          }

          // Mettre à jour la session d'import (Neon)
          await prisma.importSession.update({
            where: { id: sessionId },
            data: {
              totalRows: rowCount,
              validRows: validCount,
              importedRows: insertedCount,
              status: 'SUCCESS',
              updatedAt: new Date(),
            }
          });

          const finalCount = await prisma.transaction.count();
          const totalTime = (Date.now() - startTime) / 1000;
          const rate = rowCount / totalTime;

          console.log('=== FIN IMPORT ULTRA-RAPIDE ===');
          console.log('Lignes traitées:', rowCount.toLocaleString());
          console.log('Transactions valides:', validCount.toLocaleString());
          console.log('Transactions insérées:', insertedCount.toLocaleString());
          console.log('Total final:', finalCount.toLocaleString());
          console.log('Temps total:', totalTime.toFixed(2), 'secondes');
          console.log('Vitesse:', rate.toFixed(0), 'lignes/seconde');

          resolve(NextResponse.json({
            message: 'Fichier CSV importé avec succès (mode ultra-rapide)',
            importSessionId: sessionId,
            totalRows: rowCount,
            validTransactions: validCount,
            insertedTransactions: insertedCount,
            existingTransactions: existingCount,
            finalTransactions: finalCount,
            newTransactionsAdded: insertedCount,
            duplicatesIgnored: validCount - insertedCount,
            processingTime: totalTime,
            processingRate: rate,
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
    console.error('Erreur lors de l\'import CSV ultra-rapide:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// Fonction pour valider une transaction
function isValidTransaction(record: any): boolean {
  // Mapper les noms de colonnes possibles
  const transactionId = record['Transaction ID'] || record['transactionId'] || record['TransactionId'];
  const transactionTime = record['Transaction Initiated Time'] || record['transactionInitiatedTime'] || record['TransactionInitiatedTime'];
  const frmsisdn = record['FRMSISDN'] || record['frmsisdn'] || record['FrMsisdn'];
  const tomsisdn = record['TOMSISDN'] || record['tomsisdn'] || record['ToMsisdn'];
  
  return !!(transactionId && transactionTime && frmsisdn && tomsisdn && 
           transactionId.trim() !== '' && transactionTime.trim() !== '' && 
           frmsisdn.trim() !== '' && tomsisdn.trim() !== '');
}

// Fonction pour transformer une transaction
function transformTransaction(record: any, importSessionId: string) {
  const now = new Date().toISOString();
  
  // Mapper les noms de colonnes avec plusieurs variantes possibles
  const transactionId = record['Transaction ID'] || record['transactionId'] || record['TransactionId'];
  const transactionTime = record['Transaction Initiated Time'] || record['transactionInitiatedTime'] || record['TransactionInitiatedTime'];
  const frmsisdn = record['FRMSISDN'] || record['frmsisdn'] || record['FrMsisdn'];
  const tomsisdn = record['TOMSISDN'] || record['tomsisdn'] || record['ToMsisdn'];
  const frProfile = record['FRPROFILE'] || record['frProfile'] || record['FrProfile'] || '';
  const toProfile = record['TOPROFILE'] || record['toProfile'] || record['ToProfile'] || '';
  const transactionType = record['Transaction Type'] || record['transactionType'] || record['TransactionType'] || '';
  const originalAmount = record['Original Amount'] || record['originalAmount'] || record['OriginalAmount'] || 0;
  const fee = record['Fee'] || record['fee'] || 0;
  const commissionAll = record['Commission ALL'] || record['commissionAll'] || record['CommissionAll'] || 0;
  const merchantsOnlineCashIn = record['merchantsOnlineCashIn'] || record['MerchantsOnlineCashIn'] || '';
  const commissionDistributeur = record['COMMISSION_DISTRIBUTEUR'] || record['commissionDistributeur'] || record['CommissionDistributeur'] || 0;
  const commissionMarchand = record['COMMISSION_MARCHAND'] || record['commissionMarchand'] || record['CommissionMarchand'] || 0;
  const commissionRevendeur = record['COMMISSION_REVENDEUR'] || record['commissionRevendeur'] || record['CommissionRevendeur'] || 0;
  const commissionSousDistributeur = record['COMMISSION_SOUS_DISTRIBUTEUR'] || record['commissionSousDistributeur'] || record['CommissionSousDistributeur'] || 0;
  
  return {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    transactionId: transactionId?.trim(),
    transactionInitiatedTime: new Date(transactionTime).toISOString(),
    frmsisdn: frmsisdn?.trim(),
    tomsisdn: tomsisdn?.trim(),
    frProfile: frProfile?.trim() || '',
    toProfile: toProfile?.trim() || '',
    transactionType: transactionType?.trim() || '',
    originalAmount: parseFloat(originalAmount) || 0,
    fee: parseFloat(fee) || 0,
    commissionAll: parseFloat(commissionAll) || 0,
    merchantsOnlineCashIn: merchantsOnlineCashIn?.trim() || '',
    importSessionId: importSessionId,
    createdAt: now,
    updatedAt: now,
    commissionDistributeur: parseFloat(commissionDistributeur) || 0,
    commissionMarchand: parseFloat(commissionMarchand) || 0,
    commissionRevendeur: parseFloat(commissionRevendeur) || 0,
    commissionSousDistributeur: parseFloat(commissionSousDistributeur) || 0,
  };
}
