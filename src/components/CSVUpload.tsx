'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadResult {
  message: string;
  importSessionId?: string;
  totalRows: number;
  validTransactions: number;
  insertedTransactions: number;
  existingTransactions?: number;
  finalTransactions?: number;
  newTransactionsAdded?: number;
  duplicatesIgnored?: number;
}

interface CSVUploadProps {
  onImportSuccess?: () => void;
}

export default function CSVUpload({ onImportSuccess }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [progress, setProgress] = useState({
    processedRows: 0,
    totalRows: 0,
    percentage: 0
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      setImportId(null);
      setProgress({
        processedRows: 0,
        totalRows: 0,
        percentage: 0
      });
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    // Initialiser la progression
    setProgress({
      processedRows: 0,
      totalRows: 0,
      percentage: 0
    });

    try {
      // Ne pas charger tout le fichier: estimer le total via taille
      // On laisse le serveur fournir total/processed; ici, affichage à 0 au départ
      setProgress({ processedRows: 0, totalRows: 0, percentage: 0 });

      const formData = new FormData();
      formData.append('file', file);

      // Démarrer le traitement avec progression en temps réel
      const response = await fetch('/api/upload-csv-progress', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const sessionId = data.importId || data.sessionId;
        
        // Polling pour récupérer la progression en temps réel
        const pollProgress = async () => {
          const progressResponse = await fetch(`/api/upload-csv-progress?importId=${sessionId}`);
          const progressData = await progressResponse.json();
          
          if (progressResponse.ok) {
            setProgress({
              processedRows: progressData.processed,
              totalRows: progressData.total,
              percentage: progressData.progress
            });

            if (progressData.status === 'completed') {
              setResult({
                message: 'Fichier CSV importé avec succès',
                importSessionId: sessionId,
                totalRows: progressData.result?.totalRows ?? progressData.total,
                validTransactions: progressData.result?.validTransactions ?? progressData.processed,
                insertedTransactions: progressData.result?.insertedTransactions ?? progressData.processed,
              });
              setImportId(sessionId);
              
              // Appeler le callback de succès pour rafraîchir l'historique
              if (onImportSuccess) {
                // Attendre un peu pour que l'import soit complètement terminé
                setTimeout(() => {
                  onImportSuccess();
                }, 1000);
              }
              
              setUploading(false);
            } else if (progressData.status === 'error') {
              throw new Error(progressData.error || 'Erreur lors du traitement');
            } else {
              // Continuer le polling
              setTimeout(pollProgress, 500); // Vérifier toutes les 500ms pour réduire la charge
            }
          } else {
            throw new Error('Erreur lors de la récupération de la progression');
          }
        };

        // Démarrer le polling
        pollProgress();
      } else {
        throw new Error(data.error || 'Erreur lors de l\'upload');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setUploading(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className={`h-5 w-5 ${uploading ? 'animate-pulse text-blue-600' : ''}`} />
          Import de fichier CSV
          {uploading && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full animate-pulse">
              EN COURS
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {uploading 
            ? "Traitement en cours, veuillez ne pas fermer cette page..."
            : "Importez vos données de transactions depuis un fichier CSV"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="csv-file" className="text-sm font-medium">
            Sélectionner un fichier CSV
          </label>
          <input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {file && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">{file.name}</span>
            <span className="text-xs text-gray-500">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Import en cours...</span>
            </div>
          ) : (
            'Importer le fichier'
          )}
        </Button>

        {/* Barre de progression */}
        {uploading && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div>
                <div className="font-medium text-blue-800">Import en cours...</div>
                <div className="text-sm text-blue-600">
                  {progress.percentage < 100 
                    ? `Traitement du fichier CSV - ${progress.percentage}% terminé`
                    : 'Finalisation de l\'import...'
                  }
                </div>
              </div>
            </div>
            
            {/* Progression avec nombre de lignes */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-800">Progression</span>
                <span className="text-sm font-bold text-blue-800">{progress.percentage}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-200 ease-out" 
                  style={{width: `${progress.percentage}%`}}
                ></div>
              </div>
              <div className="flex justify-between items-center text-sm text-blue-700">
                <span>{progress.processedRows} / {progress.totalRows} lignes traitées</span>
                <span>
                  {progress.totalRows > 0 && (
                    `${Math.round((progress.processedRows / progress.totalRows) * 100)}%`
                  )}
                </span>
              </div>
              
              {/* Estimation du temps restant */}
              {progress.percentage > 0 && progress.percentage < 100 && (
                <div className="text-xs text-blue-600 text-center">
                  {progress.percentage < 10 
                    ? 'Démarrage du traitement...'
                    : progress.percentage < 50
                    ? 'Traitement en cours...'
                    : progress.percentage < 90
                    ? 'Traitement avancé...'
                    : 'Finalisation...'
                  }
                </div>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Import réussi !</span>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <p>• {result.validTransactions} lignes traitées</p>
              <p>• {result.validTransactions} transactions valides</p>
              <p>• {result.insertedTransactions} transactions importées</p>
              {result.existingTransactions !== undefined && (
                <>
                  <p>• {result.existingTransactions} transactions existantes avant import</p>
                  <p>• {result.finalTransactions} transactions totales après import</p>
                  <p>• <strong>{result.newTransactionsAdded} nouvelles transactions ajoutées</strong></p>
                  {result.duplicatesIgnored && result.duplicatesIgnored > 0 && (
                    <p>• {result.duplicatesIgnored} doublons ignorés</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">Erreur d'import</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Colonnes CSV officielles supportées :</strong></p>
          <p>• <strong>Transaction ID</strong> - Identifiant unique</p>
          <p>• <strong>Transaction Initiated Time</strong> - Date/heure (format: DD/MM/YYYY HH:MM:SS)</p>
          <p>• <strong>FRMSISDN / TOMSISDN</strong> - Numéros de téléphone</p>
          <p>• <strong>FRPROFILE / TOPROFILE</strong> - Profils utilisateurs</p>
          <p>• <strong>Transaction Type</strong> - Type de transaction</p>
          <p>• <strong>Original Amount</strong> - Montant original</p>
          <p>• <strong>Fee</strong> - Frais de transaction</p>
          <p>• <strong>Commission ALL</strong> - Commission totale</p>
          <p>• <strong>MSISDN_MARCHAND</strong> - Marchand</p>
        </div>
      </CardContent>
    </Card>
  );
}