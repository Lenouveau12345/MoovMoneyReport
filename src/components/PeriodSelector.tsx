'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PeriodSelectorProps {
  onPeriodChange: (period: string, dateFrom?: Date, dateTo?: Date) => void;
  currentPeriod: string;
}

export default function PeriodSelector({ onPeriodChange, currentPeriod }: PeriodSelectorProps) {
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const periods = [
    { key: 'day', label: 'Aujourd\'hui' },
    { key: 'week', label: 'Cette semaine' },
    { key: 'month', label: 'Ce mois' },
    { key: 'year', label: 'Cette année' },
    { key: 'custom', label: 'Période personnalisée' }
  ];

  const handlePeriodClick = (period: string) => {
    if (period === 'custom') {
      setShowCustomRange(!showCustomRange);
    } else {
      setShowCustomRange(false);
      onPeriodChange(period);
    }
  };

  const handleCustomDateSubmit = () => {
    if (customDateFrom && customDateTo) {
      const dateFrom = new Date(customDateFrom);
      const dateTo = new Date(customDateTo);
      onPeriodChange('custom', dateFrom, dateTo);
      setShowCustomRange(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getToday = () => formatDateForInput(new Date());
  const getWeekAgo = () => formatDateForInput(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Sélection de Période
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Boutons de période rapide */}
          <div className="flex flex-wrap gap-2">
            {periods.map((period) => (
              <Button
                key={period.key}
                variant={currentPeriod === period.key ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodClick(period.key)}
                className="flex items-center gap-2"
              >
                {period.label}
                {period.key === 'custom' && <ChevronDown className="h-3 w-3" />}
              </Button>
            ))}
          </div>

          {/* Sélecteur de période personnalisée */}
          {showCustomRange && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3">Période personnalisée</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    max={getToday()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    max={getToday()}
                    min={customDateFrom}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={handleCustomDateSubmit}
                  disabled={!customDateFrom || !customDateTo}
                  size="sm"
                >
                  Appliquer
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCustomRange(false)}
                  size="sm"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Boutons de période rapide prédéfinie */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Périodes rapides</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const yesterday = new Date(today);
                  yesterday.setDate(today.getDate() - 1);
                  onPeriodChange('custom', yesterday, today);
                }}
              >
                Hier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today);
                  weekAgo.setDate(today.getDate() - 7);
                  onPeriodChange('custom', weekAgo, today);
                }}
              >
                Derniers 7 jours
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const monthAgo = new Date(today);
                  monthAgo.setDate(today.getDate() - 30);
                  onPeriodChange('custom', monthAgo, today);
                }}
              >
                Derniers 30 jours
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
