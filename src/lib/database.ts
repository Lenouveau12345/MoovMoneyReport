/**
 * Utilitaires pour la base de données PostgreSQL
 * Gestion des insertions avec gestion des doublons
 */

import { prisma } from './prisma';

/**
 * Insère un batch de transactions en gérant les doublons pour PostgreSQL
 * Alternative à skipDuplicates qui n'est pas supporté par PostgreSQL
 */
export async function insertTransactionsWithDuplicateHandling(
  transactions: any[],
  importSessionId?: string
): Promise<{ inserted: number; ignored: number }> {
  let inserted = 0;
  let ignored = 0;

  for (const transaction of transactions) {
    try {
      const data = {
        ...transaction,
        ...(importSessionId && { importSessionId })
      };

      await prisma.transaction.create({
        data
      });
      inserted++;
    } catch (error: any) {
      // Si c'est une erreur de contrainte unique (doublon), on ignore
      if (error.code === 'P2002') {
        ignored++;
      } else {
        // Pour les autres erreurs, on les relance
        throw error;
      }
    }
  }

  return { inserted, ignored };
}

/**
 * Insère un batch de transactions avec upsert (PostgreSQL compatible)
 * Plus efficace pour de gros volumes
 */
export async function insertTransactionsWithUpsert(
  transactions: any[],
  importSessionId?: string
): Promise<{ inserted: number; ignored: number }> {
  let inserted = 0;
  let ignored = 0;

  // Grouper les transactions par chunks pour éviter les timeouts
  const chunkSize = 100;
  
  for (let i = 0; i < transactions.length; i += chunkSize) {
    const chunk = transactions.slice(i, i + chunkSize);
    
    for (const transaction of chunk) {
      try {
        const data = {
          ...transaction,
          ...(importSessionId && { importSessionId })
        };

        // Utiliser upsert pour gérer les doublons
        await prisma.transaction.upsert({
          where: {
            transactionId: transaction.transactionId
          },
          update: {
            // Mettre à jour les champs si la transaction existe déjà
            originalAmount: transaction.originalAmount,
            fee: transaction.fee,
            commissionAll: transaction.commissionAll,
            updatedAt: new Date()
          },
          create: data
        });
        inserted++;
      } catch (error: any) {
        console.warn(`Erreur lors de l'insertion de la transaction ${transaction.transactionId}:`, error.message);
        ignored++;
      }
    }
  }

  return { inserted, ignored };
}

/**
 * Vérifie si la base de données est bien connectée à PostgreSQL
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    return false;
  }
}

/**
 * Obtient des informations sur la base de données
 */
export async function getDatabaseInfo() {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as version
    `;
    return result;
  } catch (error) {
    console.error('Erreur lors de la récupération des infos DB:', error);
    return null;
  }
}
