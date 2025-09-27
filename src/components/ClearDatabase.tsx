'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, CheckCircle, Database } from 'lucide-react';

export default function ClearDatabase() {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    deletedCount?: number;
  } | null>(null);

  const handleClearDatabase = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/clear-database', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          deletedCount: data.deletedCount
        });
        setShowConfirm(false);
        
        // Rafraîchir la page après 2 secondes pour mettre à jour les statistiques
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setResult({
          success: false,
          message: data.error || 'Erreur lors de la suppression'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Erreur de connexion'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setResult(null);
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <Database className="h-5 w-5" />
          Gestion de la Base de Données
        </CardTitle>
        <CardDescription>
          Actions de maintenance sur la base de données SQLite
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showConfirm && !result && (
          <div className="space-y-3">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Attention</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Cette action supprimera <strong>définitivement</strong> toutes les transactions 
                    de la base de données. Cette action est <strong>irréversible</strong>.
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => setShowConfirm(true)}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Vider la Base de Données
            </Button>
          </div>
        )}

        {showConfirm && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Confirmation Requise</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Êtes-vous sûr de vouloir supprimer <strong>toutes les transactions</strong> 
                    de la base de données ? Cette action ne peut pas être annulée.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleClearDatabase}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Oui, Supprimer Tout
                  </>
                )}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div>
                <h4 className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? 'Suppression Réussie' : 'Erreur'}
                </h4>
                <p className={`text-sm mt-1 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                  {result.deletedCount && (
                    <span className="block mt-1">
                      {result.deletedCount} transactions supprimées
                    </span>
                  )}
                </p>
                {result.success && (
                  <p className="text-xs text-green-600 mt-2">
                    La page va se rafraîchir automatiquement...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
