'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, AlertCircle, Zap, Clock, Database, Rocket } from 'lucide-react';
import ChunkedUploadControls from '@/components/ChunkedUploadControls';

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
  processingTime?: number;
  processingRate?: number;
}

interface UltraFastUploadProps {
  onImportSuccess?: () => void;
}

export default function UltraFastUpload({ onImportSuccess }: UltraFastUploadProps) {
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

      console.log('Début de l\'upload ultra-rapide:', file.name, 'Taille:', file.size);

      const response = await fetch('/api/upload-csv-ultra', { method: 'POST', body: formData });

      const data = await response.json();

      if (response.ok) {
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
          processingTime: data.processingTime,
          processingRate: data.processingRate,
        });

        // Appeler le callback de succès
        if (onImportSuccess) {
          setTimeout(() => {
            onImportSuccess();
          }, 1000);
        }
      } else {
        setError(data.error || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      setError('Erreur de connexion lors de l\'upload');
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
      <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          Import Ultra-Rapide
        </CardTitle>
        <CardDescription>
          Optimisé pour 1 million de lignes en 30 secondes (better-sqlite3 + batchs 10k)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Informations sur les capacités ultra-rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <Rocket className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <h3 className="font-semibold text-red-900">30s</h3>
            <p className="text-sm text-red-700">1M lignes</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <Database className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-orange-900">10M Lignes</h3>
            <p className="text-sm text-orange-700">Maximum</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-900">10k Batchs</h3>
            <p className="text-sm text-green-700">Optimisé</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-blue-900">2GB</h3>
            <p className="text-sm text-blue-700">Taille max</p>
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
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
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
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
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
          className="w-full h-12 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
        >
          {uploading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Traitement ultra-rapide...
            </div>
          ) : (
            <>
              <Rocket className="w-4 h-4 mr-2" />
              Import Ultra-Rapide
            </>
          )}
        </Button>

        {file && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Mode découpage (10 000 lignes par chunk)</h4>
            <ChunkedUploadControls
              file={file}
              linesPerChunk={10000}
              endpoint="/api/upload-csv-ultra"
            />
          </div>
        )}

        {/* Barre de progression */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Traitement ultra-rapide en cours...</span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-red-600 to-orange-600 h-2 rounded-full transition-all duration-300"
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

        {/* Résultats détaillés */}
        {result && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Import ultra-rapide réussi !</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Lignes traitées:</strong> {result.validTransactions.toLocaleString()}</p>
                <p><strong>Transactions valides:</strong> {result.validTransactions.toLocaleString()}</p>
                <p><strong>Nouvelles transactions:</strong> {result.newTransactionsAdded?.toLocaleString()}</p>
              </div>
              <div>
                <p><strong>Temps de traitement:</strong> {result.processingTime?.toFixed(2)}s</p>
                <p><strong>Vitesse:</strong> {result.processingRate?.toFixed(0)} lignes/s</p>
                <p><strong>Doublons ignorés:</strong> {result.duplicatesIgnored?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Informations techniques */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Optimisations Techniques</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>better-sqlite3:</strong> Mode synchrone ultra-rapide</li>
                <li>• <strong>Batchs 10k:</strong> Insertions groupées optimisées</li>
                <li>• <strong>INSERT OR IGNORE:</strong> Gestion des doublons sans vérification</li>
                <li>• <strong>Streaming:</strong> Traitement sans chargement mémoire</li>
                <li>• <strong>Pragma SQLite:</strong> Optimisations de performance</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
