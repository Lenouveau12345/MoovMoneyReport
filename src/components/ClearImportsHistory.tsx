'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface ClearImportsHistoryProps {
  onClearSuccess?: () => void;
}

export default function ClearImportsHistory({ onClearSuccess }: ClearImportsHistoryProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    deletedTransactions?: number;
    deletedImportSessions?: number;
  } | null>(null);

  const handleClearImports = async () => {
    setIsClearing(true);
    setResult(null);

    try {
      const response = await fetch('/api/clear-imports', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message,
          deletedTransactions: data.deletedTransactions,
          deletedImportSessions: data.deletedImportSessions,
        });
        
        // Appeler le callback de succès
        if (onClearSuccess) {
          onClearSuccess();
        }
      } else {
        setResult({
          success: false,
          message: data.error || 'Erreur lors de la suppression',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'historique:', error);
      setResult({
        success: false,
        message: 'Erreur de connexion lors de la suppression',
      });
    } finally {
      setIsClearing(false);
      setShowConfirmation(false);
    }
  };

  const handleConfirmClear = () => {
    handleClearImports();
  };

  const handleCancelClear = () => {
    setShowConfirmation(false);
    setResult(null);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-white" />
          </div>
          Vider l'Historique des Imports
        </CardTitle>
        <CardDescription>
          Supprimer définitivement toutes les transactions et sessions d'import
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {!showConfirmation && !result && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-2">⚠️ Action Irréversible</h4>
                  <p className="text-sm text-red-700 mb-3">
                    Cette action supprimera définitivement :
                  </p>
                  <ul className="text-sm text-red-700 space-y-1 ml-4">
                    <li>• Toutes les transactions importées</li>
                    <li>• Toutes les sessions d'import</li>
                    <li>• L'historique complet des imports</li>
                  </ul>
                  <p className="text-sm text-red-700 mt-3 font-medium">
                    Cette action ne peut pas être annulée !
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowConfirmation(true)}
              variant="destructive"
              className="w-full h-12 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
              disabled={isClearing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Vider l'Historique des Imports
            </Button>
          </div>
        )}

        {showConfirmation && !result && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-2">Confirmation Requise</h4>
                  <p className="text-sm text-yellow-700">
                    Êtes-vous sûr de vouloir supprimer définitivement tout l'historique des imports ?
                    Cette action ne peut pas être annulée.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleConfirmClear}
                variant="destructive"
                className="flex-1 h-12"
                disabled={isClearing}
              >
                {isClearing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Suppression...
                  </div>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Oui, Supprimer Tout
                  </>
                )}
              </Button>
              <Button
                onClick={handleCancelClear}
                variant="outline"
                className="flex-1 h-12"
                disabled={isClearing}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className={`border rounded-lg p-4 ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <h4 className={`font-semibold mb-2 ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {result.success ? '✅ Suppression Réussie' : '❌ Erreur de Suppression'}
                  </h4>
                  <p className={`text-sm ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.message}
                  </p>
                  {result.success && result.deletedTransactions !== undefined && (
                    <div className="mt-3 text-sm text-green-700">
                      <p>• Transactions supprimées : {result.deletedTransactions}</p>
                      <p>• Sessions d'import supprimées : {result.deletedImportSessions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                setResult(null);
                setShowConfirmation(false);
              }}
              variant="outline"
              className="w-full h-12"
            >
              <X className="w-4 h-4 mr-2" />
              Fermer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
