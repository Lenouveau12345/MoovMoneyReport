'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface DataStatus {
  success: boolean;
  totalTransactions: number;
  totalVolume: number;
  totalFees: number;
  sampleTransactions: any[];
  transactionTypes: any[];
  message: string;
}

export default function DataStatusCard() {
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDataStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/test-data');
      const data = await response.json();
      setDataStatus(data);
    } catch (error) {
      console.error('Erreur lors du chargement du statut des données:', error);
      setDataStatus({
        success: false,
        totalTransactions: 0,
        totalVolume: 0,
        totalFees: 0,
        sampleTransactions: [],
        transactionTypes: [],
        message: 'Erreur de connexion à la base de données'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataStatus();
  }, []);

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
            <Database className="h-5 w-5" />
            Statut des Données
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Vérification des données...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Statut des Données
          {dataStatus?.success ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dataStatus?.success ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {dataStatus.totalTransactions}
                </div>
                <div className="text-sm text-green-700">Transactions</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {formatAmount(dataStatus.totalVolume)}
                </div>
                <div className="text-sm text-blue-700">Volume Total</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {formatAmount(dataStatus.totalFees)}
                </div>
                <div className="text-sm text-purple-700">Frais Totaux</div>
              </div>
            </div>

            {dataStatus.sampleTransactions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Exemples de Transactions</h4>
                <div className="space-y-2">
                  {dataStatus.sampleTransactions.slice(0, 3).map((tx, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium text-sm">{tx.transactionId}</span>
                        <span className="text-xs text-gray-500 ml-2">({tx.transactionType})</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">{formatAmount(tx.originalAmount)}</div>
                        <div className="text-xs text-gray-500">Frais: {formatAmount(tx.fee)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dataStatus.transactionTypes.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Types de Transactions</h4>
                <div className="flex flex-wrap gap-2">
                  {dataStatus.transactionTypes.map((type, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {type.type} ({type.count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center text-sm text-green-600 font-medium">
              ✓ Données réelles de la base SQLite
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">Aucune donnée trouvée</p>
            <p className="text-sm text-gray-500 mt-2">
              Importez un fichier CSV pour commencer à utiliser l'application
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
