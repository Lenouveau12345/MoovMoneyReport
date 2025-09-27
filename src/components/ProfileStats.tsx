'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign, Hash } from 'lucide-react';

interface ProfileStat {
  profile: string;
  count: number;
  totalAmount: number;
  totalFees: number;
  totalCommissions: number;
  percentage: number;
}

interface ProfileStatsData {
  frProfiles: ProfileStat[];
  toProfiles: ProfileStat[];
  summary: {
    totalTransactions: number;
    totalAmount: number;
    uniqueFrProfiles: number;
    uniqueToProfiles: number;
  };
}

interface DateRange {
  startDate: string;
  endDate: string;
}

interface ProfileStatsProps {
  refreshKey?: number;
  dateRange?: DateRange;
}

export default function ProfileStats({ refreshKey, dateRange }: ProfileStatsProps = {}) {
  const [data, setData] = useState<ProfileStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const timestamp = Date.now();
      const params = new URLSearchParams({ t: timestamp.toString() });
      
      if (dateRange?.startDate && dateRange?.endDate) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }
      
      const response = await fetch(`/api/stats/profile-stats?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
            <Users className="w-5 h-5 text-orange-600" />
            Statistiques des Profils
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
            <Users className="w-5 h-5 text-orange-600" />
            Statistiques des Profils
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p className="mb-4">Erreur: {error}</p>
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

  if (!data || (data.frProfiles.length === 0 && data.toProfiles.length === 0)) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            Statistiques des Profils
          </CardTitle>
          <CardDescription>
            Aucune donnée de profil trouvée. Importez d'abord des données CSV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
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
          <Users className="w-5 h-5 text-orange-600" />
          Statistiques des Profils
        </CardTitle>
        <CardDescription>
          Répartition des transactions par profil expéditeur et destinataire
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Résumé global */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-orange-700 font-medium">Profils FR Uniques</p>
                <p className="text-2xl font-bold text-orange-900">{data.summary.uniqueFrProfiles}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-green-700 font-medium">Profils TO Uniques</p>
                <p className="text-2xl font-bold text-green-900">{data.summary.uniqueToProfiles}</p>
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
        </div>

        {/* Détail des profils */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profils FR */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
              Profils Expéditeurs (FRPROFILE)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-orange-50">
                    <th className="text-left p-2 font-medium text-orange-900">Profil</th>
                    <th className="text-right p-2 font-medium text-orange-900">%</th>
                    <th className="text-right p-2 font-medium text-orange-900">Transactions</th>
                    <th className="text-right p-2 font-medium text-orange-900">Montant</th>
                    <th className="text-right p-2 font-medium text-orange-900">Frais</th>
                    <th className="text-right p-2 font-medium text-orange-900">Commissions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.frProfiles.map((profile, index) => (
                    <tr key={profile.profile} className="border-b hover:bg-orange-50">
                      <td className="p-2">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                          {profile.profile}
                        </span>
                      </td>
                      <td className="p-2 text-right text-orange-700 font-medium">
                        {profile.percentage.toFixed(1)}%
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatNumber(profile.count)}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatAmount(profile.totalAmount)}
                      </td>
                      <td className="p-2 text-right font-medium text-gray-600">
                        {formatAmount(profile.totalFees)}
                      </td>
                      <td className="p-2 text-right font-medium text-green-600">
                        {formatAmount(profile.totalCommissions)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Profils TO */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              Profils Destinataires (TOPROFILE)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-green-50">
                    <th className="text-left p-2 font-medium text-green-900">Profil</th>
                    <th className="text-right p-2 font-medium text-green-900">%</th>
                    <th className="text-right p-2 font-medium text-green-900">Transactions</th>
                    <th className="text-right p-2 font-medium text-green-900">Montant</th>
                    <th className="text-right p-2 font-medium text-green-900">Frais</th>
                    <th className="text-right p-2 font-medium text-green-900">Commissions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.toProfiles.map((profile, index) => (
                    <tr key={profile.profile} className="border-b hover:bg-green-50">
                      <td className="p-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {profile.profile}
                        </span>
                      </td>
                      <td className="p-2 text-right text-green-700 font-medium">
                        {profile.percentage.toFixed(1)}%
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatNumber(profile.count)}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatAmount(profile.totalAmount)}
                      </td>
                      <td className="p-2 text-right font-medium text-gray-600">
                        {formatAmount(profile.totalFees)}
                      </td>
                      <td className="p-2 text-right font-medium text-green-600">
                        {formatAmount(profile.totalCommissions)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
