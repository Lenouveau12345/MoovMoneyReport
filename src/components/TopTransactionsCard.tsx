'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Loader2 } from 'lucide-react';

interface Transaction {
  transactionId: string;
  originalAmount: number;
  fee: number;
  commissionAll: number;
  commissionDistributeur: number;
  commissionSousDistributeur: number;
  commissionRevendeur: number;
  commissionMarchand: number;
  transactionType: string;
  frmsisdn: string;
  tomsisdn: string;
  transactionInitiatedTime: string;
}

interface TopTransactionsCardProps {
  period: string;
  customDateRange?: { from?: Date; to?: Date };
}

export default function TopTransactionsCard({ period, customDateRange }: TopTransactionsCardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopTransactions = async () => {
    try {
      setLoading(true);
      
      // Construire l'URL avec les paramètres de période
      let url = `/api/reports-simple?period=${period}`;
      if (customDateRange?.from && customDateRange?.to) {
        url += `&dateFrom=${customDateRange.from.toISOString()}&dateTo=${customDateRange.to.toISOString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.topTransactions) {
        setTransactions(data.topTransactions.slice(0, 5)); // Prendre les 5 premières
      }
    } catch (error) {
      console.error('Erreur lors du chargement des top transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopTransactions();
  }, [period, customDateRange]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="border border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Transactions
        </CardTitle>
        <p className="text-sm text-gray-600">
          Les transactions avec les montants les plus élevés
        </p>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune transaction trouvée pour cette période</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction, index) => (
              <div key={transaction.transactionId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                    <p className="font-medium text-sm">{transaction.transactionId}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{transaction.transactionType}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(transaction.transactionInitiatedTime)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatAmount(transaction.originalAmount)}</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Frais: {formatAmount(transaction.fee)}</p>
                    <p>Commission Total: {formatAmount(transaction.commissionAll)}</p>
                    <div className="text-xs space-y-0.5">
                      {transaction.commissionDistributeur > 0 && (
                        <p className="text-blue-600">Dist: {formatAmount(transaction.commissionDistributeur)}</p>
                      )}
                      {transaction.commissionSousDistributeur > 0 && (
                        <p className="text-green-600">Sous-Dist: {formatAmount(transaction.commissionSousDistributeur)}</p>
                      )}
                      {transaction.commissionRevendeur > 0 && (
                        <p className="text-orange-600">Rev: {formatAmount(transaction.commissionRevendeur)}</p>
                      )}
                      {transaction.commissionMarchand > 0 && (
                        <p className="text-red-600">March: {formatAmount(transaction.commissionMarchand)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
