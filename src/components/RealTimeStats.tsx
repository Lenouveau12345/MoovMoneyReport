'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, DollarSign, RefreshCw } from 'lucide-react';

interface StatsData {
  totalTransactions: number;
  totalVolume: number;
  totalFees: number;
  totalCommissions: number;
  averageAmount: number;
  uniqueUsers: number;
  transactionTypes: number;
}

interface RealTimeStatsProps {
  period?: string;
  customDateRange?: { from?: Date; to?: Date };
}

export default function RealTimeStats({ period = 'month', customDateRange }: RealTimeStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Construire l'URL avec les paramètres de période
      let url = `/api/reports-simple?period=${period}`;
      if (customDateRange?.from && customDateRange?.to) {
        url += `&dateFrom=${customDateRange.from.toISOString()}&dateTo=${customDateRange.to.toISOString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        // Calculer les statistiques supplémentaires
        const uniqueUsersResponse = await fetch('/api/stats/unique-users');
        const uniqueUsersData = await uniqueUsersResponse.json();
        
        const transactionTypesResponse = await fetch('/api/stats/transaction-types');
        const transactionTypesData = await transactionTypesResponse.json();

        setStats({
          totalTransactions: data.summary.totalTransactions,
          totalVolume: data.summary.totalVolume,
          totalFees: data.summary.totalFees,
          totalCommissions: data.summary.totalCommissions,
          averageAmount: data.summary.averageTransactionAmount,
          uniqueUsers: uniqueUsersData.count || 0,
          transactionTypes: transactionTypesData.count || 0,
        });
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period, customDateRange]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-gray-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chargement...</CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      {/* Bouton de rafraîchissement */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Statistiques en Temps Réel</h2>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatNumber(stats.totalTransactions) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Transactions importées
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatAmount(stats.totalVolume) : '0 FCFA'}
            </div>
            <p className="text-xs text-muted-foreground">
              Montant total des transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frais Totaux</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatAmount(stats.totalFees) : '0 FCFA'}
            </div>
            <p className="text-xs text-muted-foreground">
              Frais collectés
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatAmount(stats.totalCommissions) : '0 FCFA'}
            </div>
            <p className="text-xs text-muted-foreground">
              Commissions collectées
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Moyen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatAmount(stats.averageAmount) : '0 FCFA'}
            </div>
            <p className="text-xs text-muted-foreground">
              Par transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informations supplémentaires */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Utilisateurs Uniques</p>
                  <p className="text-lg font-semibold">{formatNumber(stats.uniqueUsers)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Types de Transactions</p>
                  <p className="text-lg font-semibold">{formatNumber(stats.transactionTypes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timestamp de dernière mise à jour */}
      {lastUpdated && (
        <p className="text-xs text-gray-500 text-center">
          Dernière mise à jour : {lastUpdated.toLocaleString('fr-FR')}
        </p>
      )}
    </div>
  );
}
