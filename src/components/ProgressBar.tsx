'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ProgressData {
  status: 'processing' | 'completed' | 'error';
  progress: number;
  total: number;
  processed: number;
  message: string;
  result?: {
    totalRows: number;
    validTransactions: number;
    insertedTransactions: number;
  };
  error?: string;
}

interface ProgressBarProps {
  importId: string | null;
  onComplete: (result: any) => void;
  onError: (error: string) => void;
}

export default function ProgressBar({ importId, onComplete, onError }: ProgressBarProps) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!importId) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    setProgressData(null);

    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/upload-csv-progress?importId=${importId}`);
        const data = await response.json();

        if (response.ok) {
          setProgressData(data);

          if (data.status === 'completed') {
            onComplete(data.result);
            // Nettoyer après 5 secondes
            setTimeout(() => {
              setIsVisible(false);
            }, 5000);
          } else if (data.status === 'error') {
            onError(data.error || 'Erreur inconnue');
            // Nettoyer après 5 secondes
            setTimeout(() => {
              setIsVisible(false);
            }, 5000);
          } else {
            // Continuer à poller
            setTimeout(pollProgress, 500);
          }
        } else {
          onError(data.error || 'Erreur lors du suivi de progression');
          setIsVisible(false);
        }
      } catch (error) {
        onError('Erreur de connexion');
        setIsVisible(false);
      }
    };

    // Démarrer le polling
    pollProgress();
  }, [importId, onComplete, onError]);

  if (!isVisible || !progressData) {
    return null;
  }

  const getStatusIcon = () => {
    switch (progressData.status) {
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (progressData.status) {
      case 'processing':
        return 'bg-blue-600';
      case 'completed':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* En-tête avec icône et message */}
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {progressData.status === 'processing' && 'Import en cours...'}
                {progressData.status === 'completed' && 'Import terminé !'}
                {progressData.status === 'error' && 'Erreur d\'import'}
              </h3>
              <p className="text-sm text-gray-600">{progressData.message}</p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {progressData.status === 'processing' && `${progressData.processed}/${progressData.total} lignes`}
                {progressData.status === 'completed' && 'Terminé'}
                {progressData.status === 'error' && 'Échec'}
              </span>
              <span className="font-medium text-gray-900">{progressData.progress}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ease-out ${getStatusColor()}`}
                style={{ width: `${progressData.progress}%` }}
              />
            </div>
          </div>

          {/* Détails du résultat */}
          {progressData.status === 'completed' && progressData.result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Résultat de l'import :</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>• {progressData.result.totalRows} lignes traitées</p>
                <p>• {progressData.result.validTransactions} transactions valides</p>
                <p>• {progressData.result.insertedTransactions} transactions importées</p>
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {progressData.status === 'error' && progressData.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-1">Erreur :</h4>
              <p className="text-sm text-red-700">{progressData.error}</p>
            </div>
          )}

          {/* Animation de chargement */}
          {progressData.status === 'processing' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span>Traitement en cours...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
