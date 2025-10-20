/**
 * Script pour créer un utilisateur de test
 */

// Charger les variables d'environnement depuis .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Vérification des utilisateurs existants...');
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    });
    
    if (existingUser) {
      console.log('✅ Utilisateur admin@test.com existe déjà');
      console.log('   Nom:', existingUser.name);
      console.log('   Email:', existingUser.email);
      console.log('   Rôle:', existingUser.role);
      return;
    }
    
    console.log('👤 Création d\'un utilisateur de test...');
    
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: hashedPassword,
        name: 'Administrateur Test',
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Utilisateur créé avec succès !');
    console.log('   ID:', user.id);
    console.log('   Nom:', user.name);
    console.log('   Email:', user.email);
    console.log('   Rôle:', user.role);
    console.log('');
    console.log('🔑 Identifiants de connexion:');
    console.log('   Email: admin@test.com');
    console.log('   Mot de passe: admin123');
    console.log('');
    console.log('🌐 Vous pouvez maintenant vous connecter sur:');
    console.log('   http://localhost:3000/auth/signin');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la création d'utilisateur
createTestUser();
