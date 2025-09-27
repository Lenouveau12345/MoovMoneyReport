'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface ReportData {
  period: string;
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalTransactions: number;
    totalVolume: number;
    totalFees: number;
    totalCommissions: number;
    averageTransactionAmount: number;
  };
  breakdown: {
    byType: Array<{
      transactionType: string;
      _count: { transactionId: number };
      _sum: { originalAmount: number; fee: number };
    }>;
    byProfile: Array<{
      frProfile: string;
      toProfile: string;
      _count: { transactionId: number };
      _sum: { originalAmount: number };
    }>;
  };
  evolution: Array<{
    date: string;
    transactionCount: number;
    totalAmount: number;
    totalFees: number;
  }>;
  topTransactions: Array<{
    transactionId: string;
    originalAmount: number;
    fee: number;
    transactionType: string;
    frmsisdn: string;
    tomsisdn: string;
    transactionInitiatedTime: string;
  }>;
}

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [customDateRange, setCustomDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const periods = [
    { value: 'day', label: 'Aujourd\'hui' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'year', label: 'Cette année' },
    { value: 'custom', label: 'Période personnalisée' },
  ];

  const fetchReport = async (period: string) => {
    setLoading(true);
    try {
      // Utiliser l'API simplifiée qui fonctionne mieux
      let url = `/api/reports-simple?period=${period}`;
      
      // Si période personnalisée, ajouter les dates
      if (period === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      
      console.log('Chargement du rapport depuis:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        console.log('Rapport chargé avec succès:', data);
        setReportData(data);
      } else {
        console.error('Erreur lors du chargement du rapport:', data.error);
        // Essayer l'API principale en fallback
        const fallbackUrl = `/api/reports?period=${period}`;
        const fallbackResponse = await fetch(fallbackUrl);
        const fallbackData = await fallbackResponse.json();
        if (fallbackResponse.ok) {
          setReportData(fallbackData);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du rapport:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPeriod === 'custom') {
      setCustomDateRange(true);
    } else {
      setCustomDateRange(false);
      fetchReport(selectedPeriod);
    }
  }, [selectedPeriod]);

  const handleCustomDateSubmit = () => {
    if (startDate && endDate) {
      fetchReport('custom');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Chargement du rapport...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reportData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Période sélection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Rapports Périodiques
          </CardTitle>
          <CardDescription>
            Analyse des transactions par période
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {periods.map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period.value)}
              >
                {period.label}
              </Button>
            ))}
          </div>

          {customDateRange && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
              <div>
                <Label htmlFor="start-date">Date de début</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Date de fin</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleCustomDateSubmit}
                  disabled={!startDate || !endDate}
                  className="w-full"
                >
                  Générer le rapport
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR').format(reportData.summary.totalTransactions)}
            </div>
            <p className="text-xs text-muted-foreground">
              Période sélectionnée
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(reportData.summary.totalVolume)}
            </div>
            <p className="text-xs text-muted-foreground">
              Montant total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frais Totaux</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(reportData.summary.totalFees)}
            </div>
            <p className="text-xs text-muted-foreground">
              Frais collectés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(reportData.summary.averageTransactionAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Par transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Répartition par type */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Type de Transaction</CardTitle>
          <CardDescription>
            Données réelles de la base SQLite
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportData.breakdown.byType.length > 0 ? (
            <div className="space-y-3">
              {reportData.breakdown.byType.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.transactionType || 'Non spécifié'}</p>
                    <p className="text-sm text-gray-500">
                      {new Intl.NumberFormat('fr-FR').format(item._count.transactionId)} transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(item._sum.originalAmount || 0)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Frais: {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(item._sum.fee || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun type de transaction trouvé</p>
              <p className="text-sm">Importez des données pour voir les statistiques</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Transactions</CardTitle>
          <CardDescription>
            Les transactions avec les plus gros montants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportData.topTransactions.length > 0 ? (
            <div className="space-y-3">
              {reportData.topTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium font-mono text-sm">{transaction.transactionId}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.frmsisdn} → {transaction.tomsisdn}
                    </p>
                    <p className="text-xs text-gray-400">
                      {transaction.transactionType || 'Non spécifié'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(transaction.originalAmount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.transactionInitiatedTime).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-xs text-gray-400">
                      Frais: {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(transaction.fee)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune transaction trouvée</p>
              <p className="text-sm">Importez des données pour voir les transactions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
