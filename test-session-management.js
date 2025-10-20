/**
 * Test de la gestion des sessions d'import pour les fichiers découpés
 */

async function testSessionManagement() {
  try {
    console.log('🧪 Test de la gestion des sessions d\'import...');
    
    // 1. Créer une session d'import
    console.log('\n📋 Étape 1: Création d\'une session d\'import...');
    const createResponse = await fetch('http://localhost:3000/api/create-import-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'test-chunked-import.csv',
        fileSize: 1024000
      })
    });
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Session créée:', createData);
      const sessionId = createData.importSessionId;
      
      // 2. Traiter un chunk avec cette session
      console.log('\n📦 Étape 2: Traitement d\'un chunk avec la session...');
      const testData = {
        rows: [
          {
            "Transaction Initiated Time": "2025-05-02 00:41:00",
            "Transaction Finish Time": "2025-05-02 00:41:00",
            "Transaction ID": "CHUNK_TEST_001",
            "FRMSISDN": "2250170000000",
            "FRNAME": "TEST USER",
            "FRPROFILE": "CUSTOMER",
            "TOMSISDN": "2250140000000",
            "TONAME": "Moov",
            "TOPROFILE": "BILL",
            "Transaction Type": "Test Transfer",
            "Original Amount": "100",
            "Fee": "5",
            "Commission ALL": "2.5",
            "MSISDN_MARCHAND": ""
          }
        ]
      };
      
      const chunkResponse = await fetch('http://localhost:3000/api/import-csv-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testData,
          importSessionId: sessionId
        })
      });
      
      if (chunkResponse.ok) {
        const chunkData = await chunkResponse.json();
        console.log('✅ Chunk traité:', chunkData);
        
        // 3. Finaliser la session
        console.log('\n✅ Étape 3: Finalisation de la session...');
        const finalizeResponse = await fetch('http://localhost:3000/api/finalize-import-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            importSessionId: sessionId,
            totalRows: 1,
            validRows: 1,
            importedRows: 1,
            status: 'SUCCESS'
          })
        });
        
        if (finalizeResponse.ok) {
          const finalizeData = await finalizeResponse.json();
          console.log('✅ Session finalisée:', finalizeData);
          
          console.log('\n🎉 Test réussi ! La gestion des sessions fonctionne correctement.');
          console.log('📋 Session ID:', sessionId);
          console.log('📊 Transactions insérées:', chunkData.inserted);
          
        } else {
          console.log('❌ Erreur lors de la finalisation:', await finalizeResponse.text());
        }
        
      } else {
        console.log('❌ Erreur lors du traitement du chunk:', await chunkResponse.text());
      }
      
    } else {
      console.log('❌ Erreur lors de la création de la session:', await createResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testSessionManagement();
