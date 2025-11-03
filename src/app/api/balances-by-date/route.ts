import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // Format: YYYY-MM-DD
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Construire les filtres de date
    const dateFilter: any = {};
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      dateFilter.gte = startOfDay;
      dateFilter.lte = endOfDay;
    } else if (fromDate && toDate) {
      dateFilter.gte = new Date(fromDate);
      dateFilter.lte = new Date(toDate);
      // Ajuster pour inclure toute la journée de fin
      dateFilter.lte.setHours(23, 59, 59, 999);
    } else {
      // Par défaut : aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      dateFilter.gte = today;
      dateFilter.lte = endOfDay;
    }

    // Récupérer toutes les transactions pour la date
    // Utiliser un select qui fonctionne même si les colonnes de balance n'existent pas encore
    let transactions;
    try {
      transactions = await prisma.transaction.findMany({
        where: {
          transactionInitiatedTime: dateFilter
        },
        select: {
          frmsisdn: true,
          tomsisdn: true,
          transactionId: true,
          transactionInitiatedTime: true,
          originalAmount: true,
          transactionType: true,
          frName: true,
          toName: true,
          frProfile: true,
          toProfile: true,
          fee: true,
          commissionAll: true,
        },
        orderBy: {
          transactionInitiatedTime: 'desc'
        }
      });

      // Essayer d'ajouter les colonnes de balance si elles existent
      // Vérifier si les colonnes existent en faisant une requête de test
      let balanceColumnsAvailable = false;
      try {
        await prisma.$queryRawUnsafe(`
          SELECT "origBalanceBefore" FROM "transactions" LIMIT 1
        `);
        balanceColumnsAvailable = true;
      } catch (e) {
        // Colonnes n'existent pas encore
        balanceColumnsAvailable = false;
      }

      if (balanceColumnsAvailable && transactions.length > 0) {
        // Les colonnes existent, refaire la requête avec toutes les colonnes
        transactions = await prisma.transaction.findMany({
          where: {
            transactionInitiatedTime: dateFilter
          },
          select: {
            frmsisdn: true,
            tomsisdn: true,
            transactionId: true,
            transactionInitiatedTime: true,
            originalAmount: true,
            transactionType: true,
            origBalanceBefore: true,
            origBalanceAfter: true,
            destBalanceBefore: true,
            destBalanceAfter: true,
            frName: true,
            toName: true,
            frProfile: true,
            toProfile: true,
            fee: true,
            commissionAll: true,
          },
          orderBy: {
            transactionInitiatedTime: 'desc'
          }
        });
      }
    } catch (dbError: any) {
      // Si erreur liée aux colonnes manquantes, utiliser une requête sans balance
      if (dbError?.message?.includes('origBalanceBefore') || dbError?.message?.includes('destBalanceBefore')) {
        console.warn('Colonnes de balance non trouvées, utilisation des données sans balance');
        transactions = await prisma.transaction.findMany({
          where: {
            transactionInitiatedTime: dateFilter
          },
          select: {
            frmsisdn: true,
            tomsisdn: true,
            transactionId: true,
            transactionInitiatedTime: true,
            originalAmount: true,
            transactionType: true,
            frName: true,
            toName: true,
            frProfile: true,
            toProfile: true,
            fee: true,
            commissionAll: true,
          },
          orderBy: {
            transactionInitiatedTime: 'desc'
          }
        });
      } else {
        throw dbError;
      }
    }

    // Grouper par FROM (frmsisdn)
    const groupedByFrom: Record<string, {
      frmsisdn: string;
      frName?: string | null;
      frProfile: string;
      lastOrigBalance: {
        origBalanceBefore: number | null;
        origBalanceAfter: number | null;
      } | null;
      recipients: Record<string, {
        tomsisdn: string;
        toName?: string | null;
        toProfile: string;
        lastTransaction: {
          transactionId: string;
          transactionInitiatedTime: Date;
          originalAmount: number;
          transactionType: string;
        } | null;
        transactions: Array<{
          transactionId: string;
          transactionInitiatedTime: Date;
          originalAmount: number;
          transactionType: string;
        }>;
        finalBalance: number | null; // Solde après la dernière transaction (destBalanceAfter)
      }>;
    }> = {};

    transactions.forEach(tx => {
      const fromKey = tx.frmsisdn;
      
      if (!groupedByFrom[fromKey]) {
        groupedByFrom[fromKey] = {
          frmsisdn: tx.frmsisdn,
          frName: tx.frName,
          frProfile: tx.frProfile,
          lastOrigBalance: null,
          recipients: {}
        };
      }

      // Mettre à jour le solde de l'expéditeur (FROM) - prendre le dernier solde
      const fromData = groupedByFrom[fromKey];
      // Pour chaque transaction, mettre à jour si c'est plus récent
      // Vérifier si les colonnes de balance existent (via 'in' operator ou vérification de type)
      const txWithBalance = tx as any;
      if ((txWithBalance.origBalanceAfter !== null && txWithBalance.origBalanceAfter !== undefined) || 
          (txWithBalance.origBalanceBefore !== null && txWithBalance.origBalanceBefore !== undefined)) {
        if (!fromData.lastOrigBalance) {
          fromData.lastOrigBalance = {
            origBalanceBefore: txWithBalance.origBalanceBefore ? Number(txWithBalance.origBalanceBefore) : null,
            origBalanceAfter: txWithBalance.origBalanceAfter ? Number(txWithBalance.origBalanceAfter) : null
          };
        } else {
          // Prendre le solde de la transaction la plus récente (on itère déjà par date desc)
          // On prend simplement le dernier rencontré avec un solde
          if (txWithBalance.origBalanceAfter !== null) {
            fromData.lastOrigBalance.origBalanceAfter = Number(txWithBalance.origBalanceAfter);
          }
          if (txWithBalance.origBalanceBefore !== null) {
            fromData.lastOrigBalance.origBalanceBefore = Number(txWithBalance.origBalanceBefore);
          }
        }
      }

      const toKey = tx.tomsisdn;
      if (!groupedByFrom[fromKey].recipients[toKey]) {
        groupedByFrom[fromKey].recipients[toKey] = {
          tomsisdn: tx.tomsisdn,
          toName: tx.toName,
          toProfile: tx.toProfile,
          lastTransaction: null,
          transactions: [],
          finalBalance: null // Solde final après la dernière transaction
        };
      }

      // Ajouter la transaction
      groupedByFrom[fromKey].recipients[toKey].transactions.push({
        transactionId: tx.transactionId,
        transactionInitiatedTime: tx.transactionInitiatedTime,
        originalAmount: Number(tx.originalAmount),
        transactionType: tx.transactionType
      });

      // Mettre à jour la dernière transaction et le solde final (uniquement destBalanceAfter)
      const recipient = groupedByFrom[fromKey].recipients[toKey];
      if (!recipient.lastTransaction || 
          new Date(tx.transactionInitiatedTime).getTime() > new Date(recipient.lastTransaction.transactionInitiatedTime).getTime()) {
        recipient.lastTransaction = {
          transactionId: tx.transactionId,
          transactionInitiatedTime: tx.transactionInitiatedTime,
          originalAmount: Number(tx.originalAmount),
          transactionType: tx.transactionType
        };
        // Prendre uniquement le solde APRÈS la dernière transaction
        const txWithBalance = tx as any;
        recipient.finalBalance = (txWithBalance.destBalanceAfter !== null && txWithBalance.destBalanceAfter !== undefined)
          ? Number(txWithBalance.destBalanceAfter)
          : null;
      }
    });

    // Convertir en tableau et trier par nombre de destinataires (décroissant)
    const result = Object.values(groupedByFrom).map(fromData => ({
      frmsisdn: fromData.frmsisdn,
      frName: fromData.frName,
      frProfile: fromData.frProfile,
      lastOrigBalance: fromData.lastOrigBalance,
      recipientsCount: Object.keys(fromData.recipients).length,
      recipients: Object.values(fromData.recipients).map(recipient => ({
        tomsisdn: recipient.tomsisdn,
        toName: recipient.toName,
        toProfile: recipient.toProfile,
        transactionsCount: recipient.transactions.length,
        lastTransaction: recipient.lastTransaction,
        finalBalance: recipient.finalBalance, // Solde après la dernière transaction
        transactions: recipient.transactions
          .sort((a, b) => 
            new Date(b.transactionInitiatedTime).getTime() - 
            new Date(a.transactionInitiatedTime).getTime()
          )
          .slice(0, 10) // Limiter à 10 dernières transactions
      })).sort((a, b) => 
        new Date(b.lastTransaction?.transactionInitiatedTime || 0).getTime() - 
        new Date(a.lastTransaction?.transactionInitiatedTime || 0).getTime()
      )
    })).sort((a, b) => b.recipientsCount - a.recipientsCount);

    return NextResponse.json({
      date: date || (fromDate && toDate ? `${fromDate} à ${toDate}` : new Date().toISOString().split('T')[0]),
      totalFromNumbers: result.length,
      totalTransactions: transactions.length,
      data: result
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des soldes:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

