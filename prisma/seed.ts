import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

  // Créer un utilisateur admin par défaut
  const adminEmail = 'admin@moovmoney.com'
  const adminPassword = 'admin123'
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Administrateur',
        role: 'ADMIN'
      }
    })
    
    console.log('✅ Utilisateur admin créé:', admin.email)
  } else {
    console.log('ℹ️ Utilisateur admin existe déjà')
  }

  // Créer un utilisateur normal par défaut
  const userEmail = 'user@moovmoney.com'
  const userPassword = 'user123'
  
  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail }
  })

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash(userPassword, 12)
    
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        password: hashedPassword,
        name: 'Utilisateur',
        role: 'USER'
      }
    })
    
    console.log('✅ Utilisateur normal créé:', user.email)
  } else {
    console.log('ℹ️ Utilisateur normal existe déjà')
  }

  console.log('🎉 Seeding terminé!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
