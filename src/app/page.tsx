'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, Filter } from "lucide-react";
import TransactionTypesWithCounts from "@/components/TransactionTypesWithCounts";
import ProfileStats from "@/components/ProfileStats";

interface StatsData {
  totalTransactions: number;
  totalImportSessions: number;
  lastImportSession?: {
    fileName: string;
    totalRows: number;
    importedRows: number;
    status: string;
    createdAt: string;
  };
}

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<'day' | 'month' | 'custom' | 'none'>('none');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Rediriger vers la page d'accueil publique si pas de session
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/landing');
    }
  }, [session, status, router]);

  const fetchStats = async () => {
    try {
      // Forcer le rafraîchissement avec un timestamp pour éviter le cache
      const timestamp = Date.now();
      const params = new URLSearchParams({ t: timestamp.toString() });
      
      // Ajouter les paramètres de période si disponibles
      const dateRange = getDateRange();
      if (dateRange.startDate && dateRange.endDate) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }
      
      const response = await fetch(`/api/stats/total-transactions?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      setStats(data);
      console.log('Stats mises à jour:', data, 'Date range:', dateRange); // Debug log
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshKey, periodType, selectedDate, customStartDate, customEndDate]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    fetchStats();
  };

  const handleResetFilter = () => {
    // Réinitialiser à l'état par défaut (aucun filtre)
    setPeriodType('none');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setCustomStartDate('');
    setCustomEndDate('');
    
    // Forcer le rafraîchissement
    setRefreshKey(prev => prev + 1);
  };

  const getDateRange = () => {
    const today = new Date();
    
    switch (periodType) {
      case 'day':
        return {
          startDate: selectedDate,
          endDate: selectedDate
        };
      case 'month':
        const monthStart = new Date(selectedDate);
        monthStart.setDate(1);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        return {
          startDate: monthStart.toISOString().split('T')[0],
          endDate: monthEnd.toISOString().split('T')[0]
        };
      case 'custom':
        return {
          startDate: customStartDate,
          endDate: customEndDate
        };
      case 'none':
      default:
        return {
          startDate: '',
          endDate: ''
        };
    }
  };


  // Afficher un écran de chargement si pas de session
  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Chargement...</h2>
          <p className="text-orange-100">Vérification de votre session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Hero Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Tableau de bord
              </CardTitle>
              <CardDescription>
                Vue d'ensemble de vos transactions et analyses financières
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRefresh}
                  className="px-3 py-1 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center gap-1"
                  disabled={loading}
                >
                  <Calendar className="w-3 h-3" />
                  {loading ? 'Actualisation...' : 'Actualiser'}
                </button>
                <div>
                  <div className="text-sm text-gray-600">
                    Dernier Import
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {loading ? '...' : stats?.lastImportSession?.fileName || 'Aucun'}
                  </div>
                  {stats?.lastImportSession && (
                    <div className="text-xs text-gray-500">
                      {stats.lastImportSession.importedRows} lignes importées sur {stats.lastImportSession.totalRows}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtres de période */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-orange-600" />
            Filtres de Période
          </CardTitle>
          <CardDescription>
            Sélectionnez la période pour actualiser les données du tableau de bord
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Type de période */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de période</label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as 'day' | 'month' | 'custom' | 'none')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="none">Aucun filtre (toutes les données)</option>
                <option value="day">Jour</option>
                <option value="month">Mois</option>
                <option value="custom">Période personnalisée</option>
              </select>
            </div>

            {/* Date de sélection */}
            {periodType !== 'custom' && periodType !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {periodType === 'day' ? 'Date' : 'Mois'}
                </label>
                <input
                  type={periodType === 'day' ? 'date' : 'month'}
                  value={periodType === 'day' ? selectedDate : selectedDate.slice(0, 7)}
                  onChange={(e) => setSelectedDate(periodType === 'day' ? e.target.value : e.target.value + '-01')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            )}

            {/* Période personnalisée */}
            {periodType === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </>
            )}

            {/* Boutons d'action */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleRefresh}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Actualiser
              </button>
              <button
                onClick={handleResetFilter}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                title="Annuler le filtre et revenir au mois en cours"
              >
                <Filter className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Affichage de la période sélectionnée */}
          <div className={`rounded-lg p-3 ${(() => {
            const range = getDateRange();
            return range.startDate && range.endDate ? 'bg-orange-50' : 'bg-gray-50';
          })()}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${(() => {
                  const range = getDateRange();
                  return range.startDate && range.endDate ? 'text-orange-600' : 'text-gray-600';
                })()}`} />
                <span className={`text-sm font-medium ${(() => {
                  const range = getDateRange();
                  return range.startDate && range.endDate ? 'text-orange-900' : 'text-gray-900';
                })()}`}>
                  Période sélectionnée :
                </span>
                <span className={`text-sm ${(() => {
                  const range = getDateRange();
                  return range.startDate && range.endDate ? 'text-orange-700' : 'text-gray-600';
                })()}`}>
                  {(() => {
                    const range = getDateRange();
                    if (periodType === 'day') {
                      return new Date(selectedDate).toLocaleDateString('fr-FR');
                    } else if (periodType === 'month') {
                      return new Date(selectedDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    } else if (periodType === 'custom' && customStartDate && customEndDate) {
                      return `${new Date(customStartDate).toLocaleDateString('fr-FR')} - ${new Date(customEndDate).toLocaleDateString('fr-FR')}`;
                    }
                    return 'Toutes les données (aucun filtre)';
                  })()}
                </span>
              </div>
              {(() => {
                const range = getDateRange();
                if (!range.startDate || !range.endDate) {
                  return (
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                      Aucun filtre
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Types de Transactions avec Totaux */}
      <TransactionTypesWithCounts refreshKey={refreshKey} dateRange={getDateRange()} />

      {/* Statistiques des Profils */}
      <ProfileStats refreshKey={refreshKey} dateRange={getDateRange()} />

    </div>
  );
}

