import { prisma } from './prisma';

export async function insertTransactionsWithUpsert(
  transactions: any[],
  importSessionId?: string
): Promise<{ inserted: number; ignored: number }> {
  let inserted = 0;
  let ignored = 0;

  const chunkSize = 100;
  
  for (let i = 0; i < transactions.length; i += chunkSize) {
    const chunk = transactions.slice(i, i + chunkSize);
    
    for (const transaction of chunk) {
      try {
        const data = {
          ...transaction,
          ...(importSessionId && { importSessionId })
        };

        await prisma.transaction.upsert({
          where: {
            transactionId: transaction.transactionId
          },
          update: {
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
      if (error.code === 'P2002') {
        ignored++;
      } else {
        throw error;
      }
    }
  }

  return { inserted, ignored };
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    return false;
  }
}

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