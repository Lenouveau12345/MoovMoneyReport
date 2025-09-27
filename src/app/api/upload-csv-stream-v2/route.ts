import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_FILE_SIZE_MB = 500; // 500 MB
const MAX_ROWS = 2_000_000; // 2 million rows
const BATCH_SIZE = 1000; // Process 1000 transactions at a time

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

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Le fichier est trop volumineux. Taille maximale: ${MAX_FILE_SIZE_MB}MB` }, { status: 400 });
    }

    console.log('=== DÉBUT IMPORT STREAMING V2 ===');
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

    let totalRows = 0;
    let validTransactionsCount = 0;
    let insertedTransactionsCount = 0;
    let duplicatesIgnored = 0;
    const transactionsToInsert: any[] = [];

    const fileStream = Readable.from(Buffer.from(await file.arrayBuffer()));

    const parser = fileStream.pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      on_record: (record, { lines }) => {
        totalRows = lines;
        if (totalRows > MAX_ROWS) {
          parser.destroy(new Error(`Le fichier contient trop de lignes. Maximum: ${MAX_ROWS}`));
          return null;
        }
        return record;
      }
    }));

    // Fonction pour insérer un batch de transactions
    const insertBatch = async (batch: any[]) => {
      let inserted = 0;
      let ignored = 0;
      
      for (const transaction of batch) {
        try {
          // Vérifier si la transaction existe déjà
          const existingTransaction = await prisma.transaction.findFirst({
            where: { 
              transactionId: transaction.transactionId,
              importSessionId: importSession.id
            }
          });

          if (existingTransaction) {
            ignored++;
            continue;
          }

          // Créer la transaction
          await prisma.transaction.create({
            data: {
              ...transaction,
              importSessionId: importSession.id,
            },
          });
          inserted++;
        } catch (error) {
          console.error('Erreur lors de l\'insertion d\'une transaction:', error);
          // Continuer avec les autres transactions
        }
      }
      
      return { inserted, ignored };
    };

    // Traiter le fichier ligne par ligne
    for await (const record of parser) {
      // Validation et transformation basique
      const transaction = {
        transactionId: record['Transaction ID'] || record['transactionId'] || record['ID'] || record['id'],
        transactionInitiatedTime: new Date(record['Transaction Initiated Time'] || record['transactionInitiatedTime'] || record['date'] || record['Date']),
        frmsisdn: record['FRMSISDN'] || record['frmsisdn'] || record['from_msisdn'] || record['fromMsisdn'] || '',
        tomsisdn: record['TOMSISDN'] || record['tomsisdn'] || record['to_msisdn'] || record['toMsisdn'] || '',
        frProfile: record['FRPROFILE'] || record['fr_profile'] || record['from_profile'] || record['fromProfile'] || '',
        toProfile: record['TOPROFILE'] || record['to_profile'] || record['receiver_profile'] || record['toProfile'] || '',
        transactionType: record['Transaction Type'] || record['transaction_type'] || record['Transaction_Type'] || record['type'] || record['Type'] || '',
        originalAmount: parseFloat(record['Original Amount'] || record['original_amount'] || record['Original_Amount'] || record['amount'] || record['Amount'] || '0'),
        fee: parseFloat(record['Fee'] || record['fee'] || record['fees'] || record['Fees'] || '0'),
        commissionAll: parseFloat(record['Commission ALL'] || record['commission_all'] || record['Commission_ALL'] || record['total_commission'] || record['totalCommission'] || '0'),
        merchantsOnlineCashIn: record['MSISDN_MARCHAND'] || record['msisdn_marchand'] || record['merchant_msisdn'] || record['merchantMsisdn'] || '',
        commissionDistributeur: parseFloat(record['COMMISSION_DISTRIBUTEUR'] || record['commission_distributeur'] || record['distributeur_commission'] || '0') || null,
        commissionMarchand: parseFloat(record['COMMISSION_MARCHAND'] || record['commission_marchand'] || record['marchand_commission'] || '0') || null,
        commissionRevendeur: parseFloat(record['COMMISSION_REVENDEUR'] || record['commission_revendeur'] || record['revendeur_commission'] || '0') || null,
        commissionSousDistributeur: parseFloat(record['COMMISSION_SOUS_DISTRIBUTEUR'] || record['commission_sous_distributeur'] || record['sous_distributeur_commission'] || '0') || null,
      };

      // Validation basique
      if (transaction.transactionId && 
          !isNaN(transaction.originalAmount) && 
          transaction.originalAmount >= 0 &&
          !isNaN(transaction.transactionInitiatedTime.getTime()) &&
          transaction.frmsisdn && 
          transaction.tomsisdn) {
        
        validTransactionsCount++;
        transactionsToInsert.push(transaction);

        // Insérer par lots
        if (transactionsToInsert.length >= BATCH_SIZE) {
          const batch = [...transactionsToInsert];
          transactionsToInsert.length = 0; // Clear array
          
          const { inserted, ignored } = await insertBatch(batch);
          insertedTransactionsCount += inserted;
          duplicatesIgnored += ignored;
          
          // Log du progrès
          if (totalRows % 10000 === 0) {
            console.log(`Progrès: ${totalRows} lignes traitées, ${insertedTransactionsCount} transactions insérées`);
          }
        }
      }
    }

    // Insérer les transactions restantes
    if (transactionsToInsert.length > 0) {
      const { inserted, ignored } = await insertBatch(transactionsToInsert);
      insertedTransactionsCount += inserted;
      duplicatesIgnored += ignored;
    }

    // Mettre à jour la session d'import
    await prisma.importSession.update({
      where: { id: importSession.id },
      data: {
        totalRows: totalRows,
        validRows: validTransactionsCount,
        importedRows: insertedTransactionsCount,
        status: 'SUCCESS',
      }
    });

    const finalCount = await prisma.transaction.count();
    const newTransactionsAdded = finalCount - existingCount;

    console.log('=== FIN IMPORT STREAMING V2 ===');
    console.log('Lignes traitées:', totalRows);
    console.log('Transactions valides:', validTransactionsCount);
    console.log('Transactions insérées:', insertedTransactionsCount);
    console.log('Doublons ignorés:', duplicatesIgnored);
    console.log('Total final:', finalCount);
    console.log('Nouvelles transactions:', newTransactionsAdded);

    return NextResponse.json({
      message: 'Fichier CSV importé avec succès (streaming v2)',
      importSessionId: importSession.id,
      totalRows: totalRows,
      validTransactions: validTransactionsCount,
      insertedTransactions: insertedTransactionsCount,
      existingTransactions: existingCount,
      finalTransactions: finalCount,
      newTransactionsAdded: newTransactionsAdded,
      duplicatesIgnored: duplicatesIgnored,
    });

  } catch (error: any) {
    console.error('Erreur lors de l\'import CSV streaming v2:', error);
    
    // Mettre à jour la session d'import en cas d'erreur
    if (importSessionId) {
      try {
        await prisma.importSession.update({
          where: { id: importSessionId },
          data: {
            status: 'FAILED',
            errorMessage: error.message || 'Erreur inconnue',
          }
        });
      } catch (updateError) {
        console.error('Erreur lors de la mise à jour de la session:', updateError);
      }
    }
    
    return NextResponse.json({
      error: 'Erreur lors de l\'import du fichier',
      details: error.message || 'Erreur inconnue'
    }, { status: 500 });
  }
}
