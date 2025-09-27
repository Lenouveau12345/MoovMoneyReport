const fs = require('fs');
const Papa = require('papaparse');

function analyzeCSVFormat(filePath) {
  console.log('=== ANALYSE DU FORMAT CSV ===');
  console.log('Fichier:', filePath);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log('❌ Fichier non trouvé. Créons un fichier de test...');
      
      // Créer un fichier de test avec différents formats possibles
      const testFormats = [
        // Format 1: Avec espaces dans les noms de colonnes
        `Transaction ID,Transaction Initiated Time,FRMSISDN,TOMSISDN,FRPROFILE,TOPROFILE,Transaction Type,Original Amount,Fee,Commission ALL,COMMISSION_DISTRIBUTEUR,COMMISSION_SOUS_DISTRIBUTEUR,COMMISSION_REVENDEUR,COMMISSION_MARCHAND,MSISDN_MARCHAND
TXN001,02/05/2025 00:03:00,237123456789,237987654321,USER,USER,TRANSFER,1000.0,50.0,25.0,10.0,0.0,5.0,10.0,N`,
        
        // Format 2: Sans espaces
        `transaction_id,transaction_initiated_time,frmsisdn,tomsisdn,fr_profile,to_profile,transaction_type,original_amount,fee,commission_all,commission_distributeur,commission_sous_distributeur,commission_revendeur,commission_marchand,msisdn_marchand
TXN001,02/05/2025 00:03:00,237123456789,237987654321,USER,USER,TRANSFER,1000.0,50.0,25.0,10.0,0.0,5.0,10.0,N`,
        
        // Format 3: Avec underscores
        `Transaction_ID,Transaction_Initiated_Time,FRMSISDN,TOMSISDN,FRPROFILE,TOPROFILE,Transaction_Type,Original_Amount,Fee,Commission_ALL,COMMISSION_DISTRIBUTEUR,COMMISSION_SOUS_DISTRIBUTEUR,COMMISSION_REVENDEUR,COMMISSION_MARCHAND,MSISDN_MARCHAND
TXN001,02/05/2025 00:03:00,237123456789,237987654321,USER,USER,TRANSFER,1000.0,50.0,25.0,10.0,0.0,5.0,10.0,N`
      ];
      
      testFormats.forEach((format, index) => {
        const fileName = `test-format-${index + 1}.csv`;
        fs.writeFileSync(fileName, format);
        console.log(`✅ Fichier de test créé: ${fileName}`);
        analyzeFile(fileName);
      });
      
      return;
    }
    
    analyzeFile(filePath);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

function analyzeFile(filePath) {
  console.log(`\n--- Analyse de ${filePath} ---`);
  
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });
    
    console.log('📊 Nombre de lignes:', parseResult.data.length);
    console.log('📋 Headers détectés:', Object.keys(parseResult.data[0] || {}));
    
    if (parseResult.data.length > 0) {
      console.log('📋 Première ligne de données:');
      console.log(parseResult.data[0]);
      
      // Vérifier les champs requis
      const requiredFields = [
        'Transaction ID', 'transaction_id', 'Transaction_ID',
        'Transaction Initiated Time', 'transaction_initiated_time', 'Transaction_Initiated_Time',
        'FRMSISDN', 'frmsisdn',
        'TOMSISDN', 'tomsisdn',
        'Original Amount', 'original_amount', 'Original_Amount'
      ];
      
      console.log('\n🔍 Vérification des champs requis:');
      const headers = Object.keys(parseResult.data[0]);
      requiredFields.forEach(field => {
        const found = headers.includes(field);
        console.log(`${found ? '✅' : '❌'} ${field}: ${found ? 'Trouvé' : 'Manquant'}`);
      });
      
      // Vérifier la validation
      console.log('\n🔍 Test de validation:');
      const firstRow = parseResult.data[0];
      
      const hasRequiredFields = firstRow['Transaction ID'] || firstRow['transaction_id'] || firstRow['Transaction_ID'] || firstRow['Transaction Initiated Time'] || firstRow['transaction_initiated_time'] || firstRow['Transaction_Initiated_Time'];
      console.log('Champs obligatoires:', hasRequiredFields);
      
      const originalAmount = parseFloat(firstRow['Original Amount'] || firstRow['original_amount'] || firstRow['Original_Amount'] || '0');
      console.log('Original Amount:', originalAmount, '> 0:', originalAmount > 0);
      
      const transactionId = (firstRow['Transaction ID'] || firstRow['transaction_id'] || firstRow['Transaction_ID'] || '').toString().trim();
      console.log('Transaction ID:', transactionId, 'Valide:', !!transactionId);
      
      const isValid = hasRequiredFields && originalAmount > 0 && transactionId;
      console.log('Transaction valide:', isValid);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error.message);
  }
}

// Analyser le fichier fourni ou créer des fichiers de test
const filePath = process.argv[2] || 'test.csv';
analyzeCSVFormat(filePath);
