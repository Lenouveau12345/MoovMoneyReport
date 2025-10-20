/**
 * Test de l'API import-csv-raw avec le bon mapping
 */

const testData = {
  rows: [
    {
      "TransactionID": "TEST001",
      "TransactionInitiatedTime": "2025-01-01T10:00:00Z",
      "FRMSISDN": "2250700000001",
      "TOMSISDN": "2250700000002",
      "FR_NAME": "John Doe",
      "TO_NAME": "Jane Smith",
      "FR_PROFILE": "CUSTOMER",
      "TO_PROFILE": "CUSTOMER",
      "TransactionType": "Transfer",
      "OriginalAmount": "1000",
      "Fee": "50",
      "CommissionALL": "25",
      "MSISDN_MARCHAND": ""
    }
  ]
};

async function testAPI() {
  try {
    console.log('🧪 Test de l\'API import-csv-raw...');
    console.log('📤 Données envoyées:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/import-csv-raw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.text();
    console.log('📥 Réponse reçue:');
    console.log('Status:', response.status);
    console.log('Body:', result);
    
    if (response.ok) {
      const data = JSON.parse(result);
      console.log('✅ Test réussi !');
      console.log('📊 Résultat:', data);
    } else {
      console.log('❌ Test échoué !');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testAPI();
