const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const { join } = require('path');

async function testDatabaseConnection() {
  console.log('=== TEST DE CONNEXION BASE DE DONNÉES ===');
  
  try {
    // Test avec Prisma
    console.log('\n1. Test avec Prisma...');
    const prisma = new PrismaClient();
    
    // Vérifier la connexion
    await prisma.$connect();
    console.log('✅ Connexion Prisma réussie');
    
    // Compter les transactions
    const transactionCount = await prisma.transaction.count();
    console.log(`📊 Nombre de transactions (Prisma): ${transactionCount}`);
    
    // Compter les sessions d'import
    const importSessionCount = await prisma.importSession.count();
    console.log(`📊 Nombre de sessions d'import (Prisma): ${importSessionCount}`);
    
    await prisma.$disconnect();
    
    // Test avec better-sqlite3
    console.log('\n2. Test avec better-sqlite3...');
    const dbPath = join(process.cwd(), 'prisma', 'dev.db');
    console.log('Chemin de la base:', dbPath);
    
    const db = new Database(dbPath);
    
    // Vérifier si la base existe et est accessible
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('📋 Tables disponibles:', tables.map(t => t.name));
    
    // Compter les transactions
    try {
      const transactionCount2 = db.prepare('SELECT COUNT(*) as count FROM transactions').get();
      console.log(`📊 Nombre de transactions (better-sqlite3): ${transactionCount2.count}`);
    } catch (error) {
      console.log('❌ Erreur lors du comptage des transactions:', error.message);
    }
    
    // Compter les sessions d'import
    try {
      const importSessionCount2 = db.prepare('SELECT COUNT(*) as count FROM import_sessions').get();
      console.log(`📊 Nombre de sessions d'import (better-sqlite3): ${importSessionCount2.count}`);
    } catch (error) {
      console.log('❌ Erreur lors du comptage des sessions:', error.message);
    }
    
    // Vérifier la structure de la table transactions
    try {
      const tableInfo = db.prepare("PRAGMA table_info(transactions)").all();
      console.log('📋 Structure de la table transactions:', tableInfo);
    } catch (error) {
      console.log('❌ Erreur lors de la vérification de la structure:', error.message);
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testDatabaseConnection();
