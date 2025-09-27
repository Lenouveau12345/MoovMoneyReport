'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react';

interface BigFileUploadV2Props {
  onImportSuccess?: () => void;
}

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

export default function BigFileUploadV2({ onImportSuccess }: BigFileUploadV2Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const MAX_FILE_SIZE_MB = 500;
  const MAX_ROWS = 2_000_000;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Le fichier est trop volumineux. Taille maximale: ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Début de l\'upload du gros fichier (v2):', file.name, 'Taille:', file.size);

      // Utiliser AbortController pour gérer les timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout

      const response = await fetch('/api/upload-csv-stream-v2', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Vérifier si la réponse est OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur de réponse:', response.status, errorText);
        setError(`Erreur ${response.status}: ${errorText || 'Erreur inconnue'}`);
        return;
      }

      // Vérifier le content-type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Réponse non-JSON reçue:', responseText);
        setError('Réponse invalide du serveur (non-JSON)');
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Erreur de parsing JSON:', jsonError);
        const responseText = await response.text();
        console.error('Contenu de la réponse:', responseText);
        setError('Erreur de format de réponse du serveur');
        return;
      }

      if (data.error) {
        setError(data.error);
        return;
      }

      setResult({
        message: data.message,
        importSessionId: data.importSessionId,
        totalRows: data.totalRows,
        validTransactions: data.validTransactions,
        insertedTransactions: data.insertedTransactions,
        existingTransactions: data.existingTransactions,
        finalTransactions: data.finalTransactions,
        newTransactionsAdded: data.newTransactionsAdded,
        duplicatesIgnored: data.duplicatesIgnored,
      });

      setProgress(100);

      // Appeler le callback de succès
      if (onImportSuccess) {
        setTimeout(() => {
          onImportSuccess();
        }, 1000);
      }

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      
      if (error.name === 'AbortError') {
        setError('Timeout: Le fichier est trop volumineux ou le traitement prend trop de temps');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Erreur de connexion au serveur');
      } else {
        setError(`Erreur: ${error.message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl text-purple-800">
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          Import de Gros Fichiers (V2 - Robuste)
        </CardTitle>
        <CardDescription className="text-purple-700">
          Importez des fichiers CSV volumineux (jusqu'à {MAX_FILE_SIZE_MB}MB, {MAX_ROWS.toLocaleString()} lignes) avec gestion d'erreurs améliorée.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Informations sur les capacités */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-blue-900">Streaming</h3>
            <p className="text-sm text-blue-700">Traitement ligne par ligne</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-900">Robuste</h3>
            <p className="text-sm text-green-700">Gestion d'erreurs avancée</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <Upload className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-orange-900">Flexible</h3>
            <p className="text-sm text-orange-700">Formats de colonnes multiples</p>
          </div>
        </div>

        {/* Sélection de fichier */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un fichier CSV volumineux
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-50 file:text-purple-700
                hover:file:bg-purple-100"
              disabled={uploading}
            />
          </div>

          {file && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bouton d'upload */}
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {uploading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Traitement en cours...
            </div>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Importer le fichier volumineux (V2)
            </>
          )}
        </Button>

        {/* Barre de progression */}
        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-purple-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {/* Messages d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Résultats */}
        {result && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Import réussi !</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Lignes traitées:</strong> {result.totalRows.toLocaleString()}</p>
                <p><strong>Transactions valides:</strong> {result.validTransactions.toLocaleString()}</p>
              </div>
              <div>
                <p><strong>Nouvelles transactions:</strong> {result.newTransactionsAdded?.toLocaleString()}</p>
                <p><strong>Doublons ignorés:</strong> {result.duplicatesIgnored?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Informations techniques */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Caractéristiques V2</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Streaming:</strong> Traitement ligne par ligne sans charger tout en mémoire</li>
                <li>• <strong>Gestion d'erreurs:</strong> Continue même si certaines lignes échouent</li>
                <li>• <strong>Timeouts:</strong> 10 minutes maximum par fichier</li>
                <li>• <strong>Formats:</strong> Détection automatique des noms de colonnes</li>
                <li>• <strong>Validation:</strong> Plus flexible pour les montants et dates</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
