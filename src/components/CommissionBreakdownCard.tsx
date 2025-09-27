'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Users, Loader2, TrendingUp } from 'lucide-react';

interface CommissionBreakdownCardProps {
  period: string;
  customDateRange?: { from?: Date; to?: Date };
}

interface CommissionData {
  totalCommissionAll: number;
  totalCommissionDistributeur: number;
  totalCommissionSousDistributeur: number;
  totalCommissionRevendeur: number;
  totalCommissionMarchand: number;
}

export default function CommissionBreakdownCard({ period, customDateRange }: CommissionBreakdownCardProps) {
  const [data, setData] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      
      // Construire l'URL avec les paramètres de période
      let url = `/api/reports-simple?period=${period}`;
      if (customDateRange?.from && customDateRange?.to) {
        url += `&dateFrom=${customDateRange.from.toISOString()}&dateTo=${customDateRange.to.toISOString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.summary) {
        setData({
          totalCommissionAll: data.summary.totalCommissions,
          totalCommissionDistributeur: data.summary.totalCommissionDistributeur,
          totalCommissionSousDistributeur: data.summary.totalCommissionSousDistributeur,
          totalCommissionRevendeur: data.summary.totalCommissionRevendeur,
          totalCommissionMarchand: data.summary.totalCommissionMarchand,
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de commission:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissionData();
  }, [period, customDateRange]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Détail des Commissions
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

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Détail des Commissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune donnée de commission disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Préparer les données pour le graphique
  const commissionBreakdown = [
    {
      name: 'Distributeur',
      value: data.totalCommissionDistributeur,
      color: '#3B82F6'
    },
    {
      name: 'Sous-Distributeur',
      value: data.totalCommissionSousDistributeur,
      color: '#10B981'
    },
    {
      name: 'Revendeur',
      value: data.totalCommissionRevendeur,
      color: '#F59E0B'
    },
    {
      name: 'Marchand',
      value: data.totalCommissionMarchand,
      color: '#EF4444'
    }
  ].filter(item => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Détail des Commissions
        </CardTitle>
        <p className="text-sm text-gray-600">
          Répartition des commissions par type d'acteur
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Total des commissions */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total des Commissions</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatAmount(data.totalCommissionAll)}
            </p>
          </div>

          {/* Graphique en barres */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commissionBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tickFormatter={(value) => formatAmount(value)}
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  formatter={(value) => [formatAmount(Number(value)), 'Commission']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Détail des commissions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commissionBreakdown.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="font-medium text-gray-700">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900">
                  {formatAmount(item.value)}
                </span>
              </div>
            ))}
          </div>

          {/* Statistiques résumées */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-blue-600">
                  {formatAmount(data.totalCommissionDistributeur)}
                </p>
                <p className="text-sm text-gray-600">Distributeur</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">
                  {formatAmount(data.totalCommissionSousDistributeur)}
                </p>
                <p className="text-sm text-gray-600">Sous-Distributeur</p>
              </div>
              <div>
                <p className="text-lg font-bold text-orange-600">
                  {formatAmount(data.totalCommissionRevendeur)}
                </p>
                <p className="text-sm text-gray-600">Revendeur</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-600">
                  {formatAmount(data.totalCommissionMarchand)}
                </p>
                <p className="text-sm text-gray-600">Marchand</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
