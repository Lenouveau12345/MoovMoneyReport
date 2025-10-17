'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ChunkedUploadControls from '@/components/ChunkedUploadControls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, AlertCircle, Zap, Database, Rocket } from 'lucide-react';

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

interface MegaUploadProps {
  onImportSuccess?: () => void;
}

export default function MegaUpload({ onImportSuccess }: MegaUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const MAX_FILE_SIZE_GB = 1; // 1GB max
  const MAX_ROWS = 5_000_000; // 5 millions de lignes max

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

    if (file.size > MAX_FILE_SIZE_GB * 1024 * 1024 * 1024) {
      setError(`Le fichier est trop volumineux. Taille maximale: ${MAX_FILE_SIZE_GB}GB`);
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Début de l\'upload mega:', file.name, 'Taille:', file.size);

      const response = await fetch('/api/upload-csv-mega', {
        method: 'POST',
        body: formData,
      });

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
        setError('Timeout: Le fichier est trop volumineux ou le traitement prend trop de temps (5 minutes max)');
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

  const isMegaFile = file && file.size > 100 * 1024 * 1024; // Plus de 100MB

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl text-indigo-800">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          Import Mega (Très Gros Fichiers)
        </CardTitle>
        <CardDescription className="text-indigo-700">
          Optimisé pour les fichiers jusqu'à {MAX_FILE_SIZE_GB}GB et {MAX_ROWS.toLocaleString()} lignes avec timeout de 5 minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Informations sur les capacités mega */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-indigo-50 rounded-lg p-4 text-center">
            <Rocket className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <h3 className="font-semibold text-indigo-900">5min</h3>
            <p className="text-sm text-indigo-700">Timeout max</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <Database className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-purple-900">5M Lignes</h3>
            <p className="text-sm text-purple-700">Maximum</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-blue-900">5k Batchs</h3>
            <p className="text-sm text-blue-700">Optimisé</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-900">1GB</h3>
            <p className="text-sm text-green-700">Taille max</p>
          </div>
        </div>

        {/* Sélection de fichier */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un fichier CSV très volumineux
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
              disabled={uploading}
            />
          </div>

          {file && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(file.size)} 
                    {isMegaFile && (
                      <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                        Mega fichier
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bouton d'upload */}
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {uploading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Traitement mega en cours...
            </div>
          ) : (
            <>
              <Rocket className="w-4 h-4 mr-2" />
              Importer le fichier mega
            </>
          )}
        </Button>

        {file && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Mode découpage (10 000 lignes par chunk)</h4>
            <ChunkedUploadControls
              file={file}
              linesPerChunk={10000}
              endpoint="/api/upload-csv-mega"
            />
          </div>
        )}

        {/* Barre de progression */}
        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full transition-all duration-300" 
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
              <span className="font-semibold">Import mega réussi !</span>
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
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-indigo-900 mb-1">Optimisations Mega</h4>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• <strong>Timeout étendu:</strong> 5 minutes maximum par fichier</li>
                <li>• <strong>Batchs optimisés:</strong> 5000 transactions par lot</li>
                <li>• <strong>Streaming avancé:</strong> Traitement sans chargement mémoire</li>
                <li>• <strong>Validation simplifiée:</strong> Optimisée pour la vitesse</li>
                <li>• <strong>Gestion d'erreurs:</strong> Continue même si certaines lignes échouent</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
