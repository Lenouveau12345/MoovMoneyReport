import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Le fichier doit être un CSV' }, { status: 400 });
    }

    console.log('=== DÉBUT IMPORT FLEXIBLE ===');
    console.log('Fichier:', file.name);
    console.log('Taille:', file.size, 'bytes');

    // Vérifier la taille du fichier pour éviter les problèmes de mémoire
    const MAX_FILE_SIZE_FLEXIBLE = 100 * 1024 * 1024; // 100MB max pour l'import flexible
    if (file.size > MAX_FILE_SIZE_FLEXIBLE) {
      return NextResponse.json({ 
        error: `Fichier trop volumineux pour l'import flexible. Taille maximale: ${MAX_FILE_SIZE_FLEXIBLE / (1024 * 1024)}MB. Utilisez l'import de gros fichiers.` 
      }, { status: 400 });
    }

    // Lire le contenu du fichier
    const text = await file.text();

    // Parser le CSV
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json({ 
        error: 'Erreur lors du parsing du CSV', 
        details: parseResult.errors 
      }, { status: 400 });
    }

    const transactions = parseResult.data as any[];
    console.log('Nombre de lignes CSV:', transactions.length);
    console.log('Headers détectés:', Object.keys(transactions[0] || {}));

    // Fonction pour mapper les colonnes de manière flexible
    const mapColumn = (row: any, possibleNames: string[], defaultValue: any = '') => {
      for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
          return row[name];
        }
      }
      return defaultValue;
    };

    // Valider et transformer les données avec mapping flexible
    const validTransactions = transactions
      .filter(tx => {
        // Vérifier qu'il y a au moins un ID de transaction
        const transactionId = mapColumn(tx, [
          'Transaction ID', 'transaction_id', 'Transaction_ID', 'transactionId', 'ID', 'id'
        ]);
        return transactionId;
      })
      .map(tx => {
        // Mapping flexible des colonnes
        const transactionId = mapColumn(tx, [
          'Transaction ID', 'transaction_id', 'Transaction_ID', 'transactionId', 'ID', 'id'
        ]).toString().trim();

        // Parser la date de manière flexible
        let transactionDate = new Date();
        const dateString = mapColumn(tx, [
          'Transaction Initiated Time', 'transaction_initiated_time', 'Transaction_Initiated_Time',
          'transactionInitiatedTime', 'date', 'Date', 'created_at', 'createdAt'
        ]);
        
        if (dateString) {
          // Essayer différents formats de date
          const dateFormats = [
            // Format DD/MM/YYYY HH:mm:ss
            /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/,
            // Format YYYY-MM-DD HH:mm:ss
            /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
            // Format DD/MM/YYYY
            /^(\d{2})\/(\d{2})\/(\d{4})$/,
            // Format YYYY-MM-DD
            /^(\d{4})-(\d{2})-(\d{2})$/,
          ];

          let parsed = false;
          for (const format of dateFormats) {
            const match = dateString.match(format);
            if (match) {
              if (format.source.includes('DD/MM/YYYY')) {
                const [, day, month, year] = match;
                transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                parsed = true;
                break;
              } else if (format.source.includes('YYYY-MM-DD')) {
                const [, year, month, day] = match;
                transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                parsed = true;
                break;
              }
            }
          }

          if (!parsed) {
            // Essayer de parser directement
            const directParse = new Date(dateString);
            if (!isNaN(directParse.getTime())) {
              transactionDate = directParse;
            }
          }
        }

        const originalAmount = parseFloat(mapColumn(tx, [
          'Original Amount', 'original_amount', 'Original_Amount', 'amount', 'Amount', 'montant'
        ], '0'));

        return {
          transactionId: transactionId || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          transactionInitiatedTime: transactionDate,
          frmsisdn: mapColumn(tx, [
            'FRMSISDN', 'frmsisdn', 'from_msisdn', 'fromMsisdn', 'sender', 'Sender'
          ]).toString().trim(),
          tomsisdn: mapColumn(tx, [
            'TOMSISDN', 'tomsisdn', 'to_msisdn', 'toMsisdn', 'receiver', 'Receiver'
          ]).toString().trim(),
          frName: mapColumn(tx, [
            'FRNAME', 'fr_name', 'from_name', 'fromName', 'sender_name', 'Sender Name'
          ]).toString().trim() || null,
          toName: mapColumn(tx, [
            'TONAME', 'to_name', 'receiver_name', 'toName', 'Receiver Name'
          ]).toString().trim() || null,
          frProfile: mapColumn(tx, [
            'FRPROFILE', 'fr_profile', 'from_profile', 'fromProfile', 'sender_profile'
          ]).toString().trim(),
          toProfile: mapColumn(tx, [
            'TOPROFILE', 'to_profile', 'receiver_profile', 'toProfile'
          ]).toString().trim(),
          transactionType: mapColumn(tx, [
            'Transaction Type', 'transaction_type', 'Transaction_Type', 'type', 'Type'
          ]).toString().trim(),
          originalAmount: originalAmount,
          fee: parseFloat(mapColumn(tx, [
            'Fee', 'fee', 'fees', 'Fees', 'commission_fee'
          ], '0')),
          commissionAll: parseFloat(mapColumn(tx, [
            'Commission ALL', 'commission_all', 'Commission_ALL', 'total_commission', 'totalCommission'
          ], '0')),
          commissionDistributeur: parseFloat(mapColumn(tx, [
            'COMMISSION_DISTRIBUTEUR', 'commission_distributeur', 'distributeur_commission'
          ], '0')) || null,
          commissionSousDistributeur: parseFloat(mapColumn(tx, [
            'COMMISSION_SOUS_DISTRIBUTEUR', 'commission_sous_distributeur', 'sous_distributeur_commission'
          ], '0')) || null,
          commissionRevendeur: parseFloat(mapColumn(tx, [
            'COMMISSION_REVENDEUR', 'commission_revendeur', 'revendeur_commission'
          ], '0')) || null,
          commissionMarchand: parseFloat(mapColumn(tx, [
            'COMMISSION_MARCHAND', 'commission_marchand', 'marchand_commission'
          ], '0')) || null,
          merchantsOnlineCashIn: mapColumn(tx, [
            'MSISDN_MARCHAND', 'msisdn_marchand', 'merchant_msisdn', 'merchantMsisdn'
          ]).toString().trim(),
        };
      })
      .filter(tx => {
        // Validation plus flexible
        const isValid = tx.transactionId && 
               !isNaN(tx.originalAmount) && 
               tx.originalAmount >= 0 && // Permettre 0 maintenant
               !isNaN(tx.transactionInitiatedTime.getTime()) &&
               tx.frmsisdn && 
               tx.tomsisdn;
        
        if (!isValid) {
          console.log('Transaction invalide:', {
            transactionId: tx.transactionId,
            originalAmount: tx.originalAmount,
            frmsisdn: tx.frmsisdn,
            tomsisdn: tx.tomsisdn,
            dateValid: !isNaN(tx.transactionInitiatedTime.getTime())
          });
        }
        
        return isValid;
      });

    console.log('Transactions valides après filtrage:', validTransactions.length);

    if (validTransactions.length === 0) {
      return NextResponse.json({ 
        error: 'Aucune transaction valide trouvée dans le fichier. Vérifiez le format des colonnes.' 
      }, { status: 400 });
    }

    // Compter les transactions existantes
    const existingCount = await prisma.transaction.count();
    console.log('Transactions existantes:', existingCount);

    // Créer une session d'import
    const importSession = await prisma.importSession.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        totalRows: transactions.length,
        validRows: validTransactions.length,
        importedRows: 0,
        status: 'SUCCESS',
      }
    });

    // Insérer les transactions par lots avec skipDuplicates
    const batchSize = 1000;
    let insertedCount = 0;
    for (let i = 0; i < validTransactions.length; i += batchSize) {
      const batch = validTransactions.slice(i, i + batchSize).map(tx => ({
        ...tx,
        importSessionId: importSession.id,
      }));
      try {
        const result = await prisma.transaction.createMany({ data: batch, skipDuplicates: true });
        insertedCount += result.count ?? 0;
      } catch (err) {
        console.error('Erreur createMany:', err);
      }
    }

    // Mettre à jour la session d'import
    await prisma.importSession.update({
      where: { id: importSession.id },
      data: {
        importedRows: insertedCount,
        status: insertedCount === validTransactions.length ? 'SUCCESS' : 'PARTIAL',
      }
    });

    const finalCount = await prisma.transaction.count();
    console.log('=== FIN IMPORT FLEXIBLE ===');
    console.log('Transactions avant:', existingCount);
    console.log('Transactions après:', finalCount);
    console.log('Nouvelles transactions:', insertedCount);

    return NextResponse.json({
      message: 'Fichier CSV importé avec succès (mode flexible)',
      importSessionId: importSession.id,
      totalRows: transactions.length,
      validTransactions: validTransactions.length,
      insertedTransactions: insertedCount,
      existingTransactions: existingCount,
      finalTransactions: finalCount,
      newTransactionsAdded: insertedCount,
      duplicatesIgnored: validTransactions.length - insertedCount,
    });

  } catch (error) {
    console.error('Erreur lors de l\'import CSV flexible:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
