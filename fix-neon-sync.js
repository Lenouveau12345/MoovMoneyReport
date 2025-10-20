/**
 * Script pour corriger la synchronisation avec Neon
 * Usage: node fix-neon-sync.js
 */

const { PrismaClient } = require('@prisma/client');

async function fixNeonSync() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Vérification de la connexion à Neon...');
    
    // Test de connexion
    await prisma.$connect();
    console.log('✅ Connexion à Neon réussie !');
    
    // Vérifier le type de base de données
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as version
    `;
    
    console.log('\n📊 Informations sur la base de données:');
    console.log('   Base:', dbInfo[0].database_name);
    console.log('   Utilisateur:', dbInfo[0].current_user);
    console.log('   Version:', dbInfo[0].version.split(' ')[0]);
    
    // Vérifier les tables
    console.log('\n📋 Vérification des tables...');
    
    const transactionCount = await prisma.transaction.count();
    console.log(`📈 Nombre de transactions: ${transactionCount}`);
    
    const importSessionCount = await prisma.importSession.count();
    console.log(`📥 Nombre de sessions d'import: ${importSessionCount}`);
    
    const userCount = await prisma.user.count();
    console.log(`👥 Nombre d'utilisateurs: ${userCount}`);
    
    // Vérifier les contraintes uniques
    console.log('\n🔍 Vérification des contraintes...');
    try {
      const constraints = await prisma.$queryRaw`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'UNIQUE'
          AND tc.table_name = 'transactions'
      `;
      
      console.log('   Contraintes uniques sur la table transactions:');
      constraints.forEach(constraint => {
        console.log(`   - ${constraint.constraint_name} sur ${constraint.column_name}`);
      });
      
    } catch (error) {
      console.log('   ⚠️ Impossible de vérifier les contraintes:', error.message);
    }
    
    // Test d'insertion avec gestion des doublons
    console.log('\n🧪 Test d\'insertion avec gestion des doublons...');
    try {
      const testTransaction = {
        transactionId: 'TEST_' + Date.now(),
        transactionInitiatedTime: new Date(),
        frmsisdn: '2250000000000',
        tomsisdn: '2250000000001',
        frProfile: 'TEST',
        toProfile: 'TEST',
        transactionType: 'Test Transaction',
        originalAmount: 100,
        fee: 0,
        commissionAll: 0,
        merchantsOnlineCashIn: ''
      };
      
      await prisma.transaction.create({
        data: testTransaction
      });
      console.log('   ✅ Insertion de test réussie');
      
      // Tenter d'insérer le même ID (devrait échouer avec erreur unique)
      try {
        await prisma.transaction.create({
          data: testTransaction
        });
        console.log('   ❌ ERREUR: Le doublon a été inséré (contrainte unique manquante)');
      } catch (uniqueError) {
        if (uniqueError.code === 'P2002') {
          console.log('   ✅ Contrainte unique fonctionne correctement');
        } else {
          console.log('   ⚠️ Erreur inattendue:', uniqueError.message);
        }
      }
      
      // Nettoyer la transaction de test
      await prisma.transaction.deleteMany({
        where: {
          transactionId: testTransaction.transactionId
        }
      });
      console.log('   🧹 Transaction de test supprimée');
      
    } catch (error) {
      console.log('   ❌ Erreur lors du test d\'insertion:', error.message);
    }
    
    console.log('\n🎉 Vérification terminée !');
    console.log('\n💡 Si vous voyez des erreurs, assurez-vous que:');
    console.log('   1. Le fichier .env.local contient la bonne URL Neon');
    console.log('   2. Les migrations ont été appliquées: npx prisma migrate dev');
    console.log('   3. Le client Prisma a été régénéré: npx prisma generate');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Suggestion: Vérifiez votre URL de connexion dans .env.local');
    } else if (error.code === 'P2021') {
      console.log('\n💡 Suggestion: Exécutez les migrations: npx prisma migrate dev');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la vérification
fixNeonSync();
