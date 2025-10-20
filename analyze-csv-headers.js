/**
 * Script pour analyser les en-têtes CSV des gros fichiers
 */

const fs = require('fs');

function analyzeCSVHeaders(filePath) {
  try {
    console.log(`🔍 Analyse du fichier: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ Fichier non trouvé');
      return;
    }

    // Lire les premières lignes du fichier
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').slice(0, 5); // Premières 5 lignes
    
    console.log('📄 Premières lignes du fichier:');
    lines.forEach((line, index) => {
      console.log(`  Ligne ${index + 1}: ${line.substring(0, 200)}${line.length > 200 ? '...' : ''}`);
    });
    
    if (lines.length > 0) {
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      console.log('📋 En-têtes détectés:');
      headers.forEach((header, index) => {
        console.log(`  ${index + 1}. "${header}"`);
      });
      
      // Analyser les patterns
      console.log('\n🔍 Analyse des patterns:');
      
      // Chercher des colonnes d'ID
      const idColumns = headers.filter(h => 
        h.toLowerCase().includes('id') || 
        h.toLowerCase().includes('transaction') ||
        h.toLowerCase().includes('reference') ||
        h.toLowerCase().includes('txn')
      );
      console.log('  - Colonnes d\'ID potentielles:', idColumns);
      
      // Chercher des colonnes de montant
      const amountColumns = headers.filter(h => 
        h.toLowerCase().includes('amount') || 
        h.toLowerCase().includes('montant') ||
        h.toLowerCase().includes('value') ||
        h.toLowerCase().includes('price')
      );
      console.log('  - Colonnes de montant potentielles:', amountColumns);
      
      // Chercher des colonnes de date
      const dateColumns = headers.filter(h => 
        h.toLowerCase().includes('date') || 
        h.toLowerCase().includes('time') ||
        h.toLowerCase().includes('created') ||
        h.toLowerCase().includes('timestamp')
      );
      console.log('  - Colonnes de date potentielles:', dateColumns);
      
      // Chercher des colonnes de téléphone
      const phoneColumns = headers.filter(h => 
        h.toLowerCase().includes('msisdn') || 
        h.toLowerCase().includes('phone') ||
        h.toLowerCase().includes('mobile') ||
        h.toLowerCase().includes('number')
      );
      console.log('  - Colonnes de téléphone potentielles:', phoneColumns);
      
      console.log('\n💡 Recommandations:');
      if (idColumns.length === 0) {
        console.log('  ⚠️  Aucune colonne d\'ID détectée - l\'import échouera');
      } else {
        console.log(`  ✅ Colonne d'ID recommandée: "${idColumns[0]}"`);
      }
      
      if (amountColumns.length === 0) {
        console.log('  ⚠️  Aucune colonne de montant détectée');
      } else {
        console.log(`  ✅ Colonne de montant recommandée: "${amountColumns[0]}"`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error.message);
  }
}

// Analyser les fichiers CSV dans le dossier uploads
const uploadsDir = './uploads';
if (fs.existsSync(uploadsDir)) {
  const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.csv'));
  
  if (files.length > 0) {
    console.log(`📁 ${files.length} fichiers CSV trouvés dans uploads/`);
    
    // Analyser le plus récent
    const latestFile = files.sort().pop();
    console.log(`\n📊 Analyse du fichier le plus récent: ${latestFile}`);
    analyzeCSVHeaders(`${uploadsDir}/${latestFile}`);
    
    // Analyser quelques autres fichiers
    const otherFiles = files.slice(-3, -1); // 2 fichiers avant le dernier
    otherFiles.forEach(file => {
      console.log(`\n📊 Analyse de: ${file}`);
      analyzeCSVHeaders(`${uploadsDir}/${file}`);
    });
  } else {
    console.log('📁 Aucun fichier CSV trouvé dans uploads/');
  }
} else {
  console.log('📁 Dossier uploads/ non trouvé');
}

// Analyser aussi le fichier de test
if (fs.existsSync('./test-smart-import.csv')) {
  console.log('\n📊 Analyse du fichier de test:');
  analyzeCSVHeaders('./test-smart-import.csv');
}
