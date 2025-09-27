import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Vérifier que c'est un fichier CSV
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Le fichier doit être un CSV' }, { status: 400 });
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

    // Log pour débogage
    console.log('=== DÉBUT IMPORT ===');
    console.log('Fichier:', file.name);
    console.log('Taille:', file.size, 'bytes');
    console.log('Nombre de lignes CSV:', transactions.length);
    console.log('Première ligne:', transactions[0]);
    console.log('Colonnes disponibles:', Object.keys(transactions[0] || {}));
    
    // Compter les transactions existantes avant l'import
    const existingCount = await prisma.transaction.count();
    console.log('Transactions existantes dans la base:', existingCount);

    // Valider et transformer les données selon les colonnes officielles
    const validTransactions = transactions
      .filter(tx => {
        // Vérifier les champs obligatoires selon les colonnes officielles
        const hasRequiredFields = tx['Transaction ID'] || tx['Transaction Initiated Time'];
        return hasRequiredFields;
      })
      .map(tx => {
        // Parser la date - format: 02/05/2025 00:03:00
        let transactionDate = new Date();
        const dateString = tx['Transaction Initiated Time'];
        if (dateString) {
          // Extraire seulement la partie date (avant l'espace)
          const dateOnly = dateString.split(' ')[0];
          // Parser le format DD/MM/YYYY
          const [day, month, year] = dateOnly.split('/');
          if (day && month && year) {
            transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
        }

        return {
          transactionId: (tx['Transaction ID'] || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).toString().trim(),
          transactionInitiatedTime: transactionDate,
          frmsisdn: (tx['FRMSISDN'] || '').toString().trim(),
          tomsisdn: (tx['TOMSISDN'] || '').toString().trim(),
          frProfile: (tx['FRPROFILE'] || '').toString().trim(),
          toProfile: (tx['TOPROFILE'] || '').toString().trim(),
          transactionType: (tx['Transaction Type'] || '').toString().trim(),
          originalAmount: parseFloat(tx['Original Amount'] || '0'),
          fee: parseFloat(tx['Fee'] || '0'),
          commissionAll: parseFloat(tx['Commission ALL'] || '0'),
          commissionDistributeur: parseFloat(tx['COMMISSION_DISTRIBUTEUR'] || '0') || null,
          commissionSousDistributeur: parseFloat(tx['COMMISSION_SOUS_DISTRIBUTEUR'] || '0') || null,
          commissionRevendeur: parseFloat(tx['COMMISSION_REVENDEUR'] || '0') || null,
          commissionMarchand: parseFloat(tx['COMMISSION_MARCHAND'] || '0') || null,
          merchantsOnlineCashIn: (tx['MSISDN_MARCHAND'] || '').toString().trim(),
        };
      })
      .filter(tx => {
        // Filtrer les transactions valides
        return tx.transactionId && 
               !isNaN(tx.originalAmount) && 
               tx.originalAmount > 0 &&
               !isNaN(tx.transactionInitiatedTime.getTime());
      });

    if (validTransactions.length === 0) {
      return NextResponse.json({ 
        error: 'Aucune transaction valide trouvée dans le fichier' 
      }, { status: 400 });
    }

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

    // Insérer les transactions dans la base de données par lots pour une meilleure performance
    const insertedTransactions = [];
    const batchSize = 50; // Traiter par lots de 50 transactions
    const totalBatches = Math.ceil(validTransactions.length / batchSize);
    
    for (let i = 0; i < validTransactions.length; i += batchSize) {
      const batch = validTransactions.slice(i, i + batchSize);
      const batchTransactions = [];
      
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
            console.log(`Transaction ${transaction.transactionId} existe déjà, ignorée`);
            continue; // Ignorer les transactions existantes
          }

          // Créer une nouvelle transaction
          const inserted = await prisma.transaction.upsert({
            where: { transactionId_importSessionId: {
              transactionId: transaction.transactionId,
              importSessionId: importSession.id,
            } },
            update: {
              ...transaction,
              importSessionId: importSession.id,
            },
            create: {
              ...transaction,
              importSessionId: importSession.id,
            },
          });
          batchTransactions.push(inserted);
        } catch (error) {
          console.error('Erreur lors de l\'insertion de la transaction:', error);
        }
      }
      
      insertedTransactions.push(...batchTransactions);
      
      // Log du progrès
      const currentBatch = Math.floor(i / batchSize) + 1;
      const progress = Math.round((currentBatch / totalBatches) * 100);
      console.log(`Traitement: ${currentBatch}/${totalBatches} lots (${progress}%) - ${insertedTransactions.length}/${validTransactions.length} transactions`);
    }

    // Mettre à jour la session d'import avec le nombre de transactions importées
    await prisma.importSession.update({
      where: { id: importSession.id },
      data: {
        importedRows: insertedTransactions.length,
        status: insertedTransactions.length === validTransactions.length ? 'SUCCESS' : 'PARTIAL',
      }
    });

    // Compter les transactions après l'import
    const finalCount = await prisma.transaction.count();
    console.log('=== FIN IMPORT ===');
    console.log('Transactions avant import:', existingCount);
    console.log('Transactions après import:', finalCount);
    console.log('Nouvelles transactions ajoutées:', finalCount - existingCount);
    console.log('Transactions ignorées (doublons):', validTransactions.length - insertedTransactions.length);

    return NextResponse.json({
      message: 'Fichier CSV importé avec succès',
      importSessionId: importSession.id,
      totalRows: transactions.length,
      validTransactions: validTransactions.length,
      insertedTransactions: insertedTransactions.length,
      existingTransactions: existingCount,
      finalTransactions: finalCount,
      newTransactionsAdded: finalCount - existingCount,
      duplicatesIgnored: validTransactions.length - insertedTransactions.length,
    });

  } catch (error) {
    console.error('Erreur lors de l\'import CSV:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}
