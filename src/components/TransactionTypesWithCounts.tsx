'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, DollarSign, Hash, Percent } from 'lucide-react';

interface TransactionTypeWithCount {
  transactionType: string;
  count: number;
  totalAmount: number;
  totalFees: number;
  averageAmount: number;
  totalCommissions: number;
}

interface TransactionTypesData {
  transactionTypes: TransactionTypeWithCount[];
  summary: {
    totalTypes: number;
    totalTransactions: number;
    totalAmount: number;
    totalFees: number;
    totalCommissions: number;
  };
  message: string;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

interface TransactionTypesWithCountsProps {
  refreshKey?: number;
  dateRange?: DateRange;
}

export default function TransactionTypesWithCounts({ refreshKey, dateRange }: TransactionTypesWithCountsProps = {}) {
  const [data, setData] = useState<TransactionTypesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Ajouter un timestamp pour forcer le rafraîchissement
      const timestamp = Date.now();
      const params = new URLSearchParams({ t: timestamp.toString() });
      
      if (dateRange?.startDate && dateRange?.endDate) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }
      
      const response = await fetch(`/api/stats/transaction-types-with-counts?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Rafraîchissement automatique toutes les 30 secondes
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refreshKey, dateRange]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            Types de Transactions avec Totaux
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement des données...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            Types de Transactions avec Totaux
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Erreur: {error}</p>
            <button 
              onClick={fetchData}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Réessayer
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.transactionTypes.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            Types de Transactions avec Totaux
          </CardTitle>
          <CardDescription>
            Aucune transaction trouvée. Importez d'abord des données CSV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune donnée disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-orange-600" />
          Types de Transactions avec Totaux
        </CardTitle>
        <CardDescription>
          Répartition détaillée par type avec statistiques complètes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Résumé global */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-orange-700 font-medium">Types Uniques</p>
                <p className="text-2xl font-bold text-orange-900">{data.summary.totalTypes}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-800" />
              <div>
                <p className="text-sm text-gray-700 font-medium">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(data.summary.totalTransactions)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-800" />
              <div>
                <p className="text-sm text-gray-700 font-medium">Montant Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(data.summary.totalAmount)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-gray-800" />
              <div>
                <p className="text-sm text-gray-700 font-medium">Frais Totaux</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(data.summary.totalFees)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-800" />
              <div>
                <p className="text-sm text-gray-700 font-medium">Commissions Totales</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(data.summary.totalCommissions)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau détaillé des types */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Détail par Type</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-orange-50">
                  <th className="text-left p-2 font-medium text-orange-900">Type de Transaction</th>
                  <th className="text-right p-2 font-medium text-orange-900">%</th>
                  <th className="text-right p-2 font-medium text-orange-900">Transactions</th>
                  <th className="text-right p-2 font-medium text-orange-900">Montant Total</th>
                  <th className="text-right p-2 font-medium text-orange-900">Frais</th>
                  <th className="text-right p-2 font-medium text-orange-900">Commissions</th>
                  <th className="text-right p-2 font-medium text-orange-900">Montant Moyen</th>
                </tr>
              </thead>
              <tbody>
                {data.transactionTypes.map((type, index) => {
                  const percentage = data.summary.totalTransactions > 0 
                    ? (type.count / data.summary.totalTransactions) * 100 
                    : 0;
                  
                  return (
                    <tr key={index} className="border-b hover:bg-orange-50">
                      <td className="p-2">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                          {type.transactionType}
                        </span>
                      </td>
                      <td className="p-2 text-right text-orange-700 font-medium">
                        {percentage.toFixed(1)}%
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatNumber(type.count)}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatAmount(type.totalAmount)}
                      </td>
                      <td className="p-2 text-right font-medium text-gray-600">
                        {formatAmount(type.totalFees)}
                      </td>
                      <td className="p-2 text-right font-medium text-green-600">
                        {formatAmount(type.totalCommissions)}
                      </td>
                      <td className="p-2 text-right font-medium text-blue-600">
                        {formatAmount(type.averageAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Boutons de rafraîchissement */}
        <div className="text-center pt-4 space-x-4">
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Actualiser les Données
          </button>
          <button 
            onClick={() => {
              setData(null);
              setError(null);
              fetchData();
            }}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/80 transition-colors"
          >
            Forcer le Rafraîchissement
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
