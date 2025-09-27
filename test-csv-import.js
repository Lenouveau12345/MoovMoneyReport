const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const Papa = require('papaparse');

async function testCSVImport() {
  console.log('=== TEST D\'IMPORT CSV ===');
  
  const prisma = new PrismaClient();
  
  try {
    // Créer un fichier CSV de test
    const testCSV = `Transaction ID,Transaction Initiated Time,FRMSISDN,TOMSISDN,FRPROFILE,TOPROFILE,Transaction Type,Original Amount,Fee,Commission ALL,COMMISSION_DISTRIBUTEUR,COMMISSION_SOUS_DISTRIBUTEUR,COMMISSION_REVENDEUR,COMMISSION_MARCHAND,MSISDN_MARCHAND
TXN001,02/05/2025 00:03:00,237123456789,237987654321,USER,USER,TRANSFER,1000.0,50.0,25.0,10.0,0.0,5.0,10.0,N
TXN002,02/05/2025 00:04:00,237111111111,237222222222,USER,USER,TRANSFER,2000.0,100.0,50.0,20.0,0.0,10.0,20.0,N
TXN003,02/05/2025 00:05:00,237333333333,237444444444,USER,USER,TRANSFER,500.0,25.0,12.5,5.0,0.0,2.5,5.0,N`;

    fs.writeFileSync('test-import.csv', testCSV);
    console.log('✅ Fichier CSV de test créé');
    
    // Parser le CSV
    const text = fs.readFileSync('test-import.csv', 'utf8');
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });
    
    console.log('📊 Lignes CSV parsées:', parseResult.data.length);
    console.log('📋 Première ligne:', parseResult.data[0]);
    
    const transactions = parseResult.data;
    
    // Appliquer la même logique de validation que l'API
    const validTransactions = transactions
      .filter(tx => {
        // Vérifier les champs obligatoires selon les colonnes officielles
        const hasRequiredFields = tx['Transaction ID'] || tx['Transaction Initiated Time'];
        console.log('Vérification champs obligatoires:', tx['Transaction ID'], tx['Transaction Initiated Time'], hasRequiredFields);
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

        const transformed = {
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
        
        console.log('Transaction transformée:', transformed);
        return transformed;
      })
      .filter(tx => {
        // Filtrer les transactions valides
        const isValid = tx.transactionId && 
               !isNaN(tx.originalAmount) && 
               tx.originalAmount > 0 &&
               !isNaN(tx.transactionInitiatedTime.getTime());
        console.log('Validation transaction:', tx.transactionId, 'isValid:', isValid, 'originalAmount:', tx.originalAmount);
        return isValid;
      });

    console.log('📊 Transactions valides après filtrage:', validTransactions.length);
    
    if (validTransactions.length === 0) {
      console.log('❌ Aucune transaction valide trouvée !');
      return;
    }
    
    // Créer une session d'import
    const importSession = await prisma.importSession.create({
      data: {
        fileName: 'test-import.csv',
        fileSize: testCSV.length,
        totalRows: transactions.length,
        validRows: validTransactions.length,
        importedRows: 0,
        status: 'SUCCESS',
      }
    });
    
    console.log('✅ Session d\'import créée:', importSession.id);
    
    // Insérer les transactions
    let insertedCount = 0;
    for (const transaction of validTransactions) {
      try {
        const existingTransaction = await prisma.transaction.findUnique({
          where: { transactionId: transaction.transactionId }
        });

        if (existingTransaction) {
          console.log(`⚠️ Transaction ${transaction.transactionId} existe déjà, ignorée`);
          continue;
        }

        const inserted = await prisma.transaction.create({
          data: {
            ...transaction,
            importSessionId: importSession.id,
          },
        });
        console.log(`✅ Transaction créée: ${inserted.id} (${transaction.transactionId})`);
        insertedCount++;
        
      } catch (error) {
        console.error(`❌ Erreur lors de l'insertion de ${transaction.transactionId}:`, error.message);
      }
    }
    
    // Mettre à jour la session
    await prisma.importSession.update({
      where: { id: importSession.id },
      data: {
        importedRows: insertedCount,
      }
    });
    
    console.log('✅ Session mise à jour avec', insertedCount, 'transactions insérées');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
    // Nettoyer le fichier de test
    if (fs.existsSync('test-import.csv')) {
      fs.unlinkSync('test-import.csv');
    }
  }
}

testCSVImport();
