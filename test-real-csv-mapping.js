/**
 * Test de l'API avec les vrais en-têtes CSV
 */

const testData = {
  rows: [
    {
      "Transaction Initiated Time": "2025-05-02 00:41:00",
      "Transaction Finish Time": "2025-05-02 00:41:00",
      "Transaction ID": "CE291D4HQN",
      "Initiator Type": "Organization Operator",
      "Service Name": "Buy Bundle for Other",
      "Transaction Type": "Buy Bundle",
      "Reason Type": "Purchase FOLIE Packages for Other by Agent",
      "FRMSISDN": "2250170000000",
      "FRNAME": "YAO BERNADIN",
      "FRALIAS": "170632655",
      "FRPROFILE": "CBRETP",
      "TOMSISDN": "2250140000000",
      "TONAME": "Moov",
      "TOALIAS": "900005",
      "TOPROFILE": "BILL",
      "Original Amount": "50",
      "Actual Amount": "50",
      "Fee": "2.5",
      "Commission ALL": "1.25",
      "COMMISSION_DISTRIBUTEUR": "0.5",
      "MSISDN_DISTRIBUTEUR": "2250000000000",
      "COMMISSION_SOUS_DISTRIBUTEUR": "0.5",
      "MSISDN_SOUS_DISTRIBUTEUR": "2250000000000",
      "COMMISSION_REVENDEUR": "0.25",
      "MSISDN_REVENDEUR": "2250000000000",
      "COMMISSION_MARCHAND": "0",
      "MSISDN_MARCHAND": "",
      "Channel": "USSD",
      "EXTENDEDDATA": "",
      "ORIGBALANCEBEFORE": "1000",
      "ORIGBALANCEAFTER": "950",
      "DESTBALANCEBEFORE": "500",
      "DESTBALANCEAFTER": "550",
      "DEBITACCOUNTTYPE": "WALLET",
      "DEBITACCOUNTNO": "2250170000000",
      "CREDITACCOUNTTYPE": "WALLET",
      "CREDITACCOUNTNO": "2250140000000",
      "CELLID": "12345",
      "Original Conversation ID": "CONV001",
      "Linked Transaction ID": "",
      "Status": "SUCCESS",
      "Checker": "SYSTEM",
      "Comments": "",
      "Failure Reason": "",
      "Remarks": ""
    }
  ]
};

async function testAPI() {
  try {
    console.log('🧪 Test de l\'API avec les vrais en-têtes CSV...');
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
      try {
        const errorData = JSON.parse(result);
        console.log('🔍 Détails de l\'erreur:', errorData);
      } catch (e) {
        console.log('🔍 Erreur brute:', result);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testAPI();
