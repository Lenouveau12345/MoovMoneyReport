'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, DollarSign, Upload, Download, FileText, Calendar, Database, ArrowLeft } from "lucide-react";
import RealTimeStats from "@/components/RealTimeStats";
import PeriodSelector from "@/components/PeriodSelector";
import TopTransactionsCard from "@/components/TopTransactionsCard";
import TransactionEvolutionCard from "@/components/TransactionEvolutionCard";
import TransactionTypeDistributionCard from "@/components/TransactionTypeDistributionCard";
import CommissionBreakdownCard from "@/components/CommissionBreakdownCard";
import Link from "next/link";

export default function RapportPeriodique() {
  const [currentPeriod, setCurrentPeriod] = useState('month');
  const [customDateRange, setCustomDateRange] = useState<{from?: Date, to?: Date}>({});

  const handlePeriodChange = (period: string, dateFrom?: Date, dateTo?: Date) => {
    setCurrentPeriod(period);
    if (dateFrom && dateTo) {
      setCustomDateRange({ from: dateFrom, to: dateTo });
    } else {
      setCustomDateRange({});
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Hero Section */}
      <Card className="border border-gray-300 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            Rapport Périodique
          </CardTitle>
          <CardDescription>
            Statistiques en temps réel et analyses détaillées
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/transactions"
          className="group"
        >
          <Card className="border border-gray-300 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 group-hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Consulter les Transactions</h3>
                  <p className="text-sm text-blue-700">Voir toutes les transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Button variant="outline" className="h-auto p-0 border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300">
          <Card className="border border-gray-300 w-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Importer CSV</h3>
                  <p className="text-sm text-green-700">Ajouter de nouvelles données</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Button>

        <Button className="h-auto p-0 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300">
          <Card className="border border-gray-300 w-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">Exporter Rapport</h3>
                  <p className="text-sm text-purple-700">Télécharger les analyses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Button>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Sélecteur de période */}
        <Card className="border border-gray-300 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              Sélection de Période
            </CardTitle>
            <CardDescription>
              Choisissez la période d'analyse pour vos rapports
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <PeriodSelector 
              onPeriodChange={handlePeriodChange}
              currentPeriod={currentPeriod}
            />
          </CardContent>
        </Card>

        {/* Stats Cards - Données réelles de la base */}
        <RealTimeStats period={currentPeriod} customDateRange={customDateRange} />

        {/* Section des rapports détaillés */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informations sur la période sélectionnée */}
          <Card className="border border-gray-300 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                Période Sélectionnée
              </CardTitle>
              <CardDescription>
                Informations sur la période d'analyse
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900">
                    <strong>Période :</strong> {
                      currentPeriod === 'day' ? 'Aujourd\'hui' :
                      currentPeriod === 'week' ? 'Cette semaine' :
                      currentPeriod === 'month' ? 'Ce mois' :
                      currentPeriod === 'year' ? 'Cette année' :
                      'Période personnalisée'
                    }
                  </p>
                </div>
                {customDateRange.from && customDateRange.to && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-900">
                      <strong>Du :</strong> {customDateRange.from.toLocaleDateString('fr-FR')} 
                      <br />
                      <strong>Au :</strong> {customDateRange.to.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    📊 Les statistiques sont mises à jour en temps réel selon la période sélectionnée
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Transactions */}
          <TopTransactionsCard period={currentPeriod} customDateRange={customDateRange} />
        </div>

        {/* Graphiques et analyses */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <TransactionEvolutionCard period={currentPeriod} customDateRange={customDateRange} />
          </div>
          <div className="lg:col-span-2">
            <TransactionTypeDistributionCard period={currentPeriod} customDateRange={customDateRange} />
          </div>
        </div>

        {/* Détail des commissions */}
        <CommissionBreakdownCard period={currentPeriod} customDateRange={customDateRange} />
      </div>
    </div>
  );
}
