'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, AlertCircle, Settings, Database } from 'lucide-react';

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

interface FlexibleUploadProps {
  onImportSuccess?: () => void;
}

export default function FlexibleUpload({ onImportSuccess }: FlexibleUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
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

      console.log('Début de l\'upload flexible:', file.name, 'Taille:', file.size);

      const response = await fetch('/api/upload-csv-flexible', {
        method: 'POST',
        body: formData,
      });

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

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          Import Flexible
        </CardTitle>
        <CardDescription>
          Détection automatique du format de colonnes - Compatible avec tous les formats CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Informations sur la flexibilité */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-blue-900">Auto-Détection</h3>
            <p className="text-sm text-blue-700">Formats de colonnes</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <Settings className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-purple-900">Flexible</h3>
            <p className="text-sm text-purple-700">Tous les formats</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <FileText className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-orange-900">Validation</h3>
            <p className="text-sm text-orange-700">Intelligente</p>
          </div>
        </div>

        {/* Sélection de fichier */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un fichier CSV (format flexible)
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
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
          className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          {uploading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Analyse et import en cours...
            </div>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Importer avec Détection Automatique
            </>
          )}
        </Button>

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
              <span className="font-semibold">Import flexible réussi !</span>
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

        {/* Informations sur la détection automatique */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Détection Automatique des Colonnes</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Transaction ID:</strong> Transaction ID, transaction_id, ID, id</li>
                <li>• <strong>Date:</strong> Transaction Initiated Time, date, created_at</li>
                <li>• <strong>Montant:</strong> Original Amount, amount, montant</li>
                <li>• <strong>Numéros:</strong> FRMSISDN/TOMSISDN, from_msisdn/to_msisdn</li>
                <li>• <strong>Commissions:</strong> Tous les formats de colonnes de commission</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
