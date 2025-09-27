'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, AlertCircle, Zap, Clock, Database } from 'lucide-react';

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

interface BigFileUploadProps {
  onImportSuccess?: () => void;
}

export default function BigFileUpload({ onImportSuccess }: BigFileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
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

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Début de l\'upload du gros fichier:', file.name, 'Taille:', file.size);

      // Utiliser AbortController pour gérer les timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

      const response = await fetch('/api/upload-csv-stream', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Vérifier si la réponse est OK avant de parser le JSON
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

  const isBigFile = file && file.size > 10 * 1024 * 1024; // Plus de 10MB

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          Import de Gros Fichiers
        </CardTitle>
        <CardDescription>
          Optimisé pour les fichiers de plus de 1 million de lignes (jusqu'à 500MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Informations sur les capacités */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-blue-900">2M Lignes</h3>
            <p className="text-sm text-blue-700">Maximum supporté</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-900">Streaming</h3>
            <p className="text-sm text-green-700">Traitement optimisé</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-orange-900">500MB</h3>
            <p className="text-sm text-orange-700">Taille maximale</p>
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
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
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
                    {isBigFile && (
                      <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        Gros fichier
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
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {uploading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Traitement en cours...
            </div>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Importer le Fichier
            </>
          )}
        </Button>

        {/* Barre de progression */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Traitement en cours...</span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
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

        {/* Avertissement pour les gros fichiers */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">Note importante</h4>
              <p className="text-sm text-yellow-700">
                Pour les fichiers de plus de 100MB, le traitement peut prendre plusieurs minutes. 
                Ne fermez pas cette page pendant l'import.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
