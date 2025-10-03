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
  existingTransactions: number;
  finalTransactions: number;
  newTransactionsAdded: number;
}

export default function TestCSVUpload() {
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

      const response = await fetch('/api/upload-csv-test', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Erreur lors de l\'import');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Test Import CSV (Version Simple)
        </CardTitle>
        <CardDescription>
          Version simplifiée pour tester l'import sans timeout
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="test-csv-file" className="text-sm font-medium">
            Sélectionner un fichier CSV
          </label>
          <input
            id="test-csv-file"
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
              <span>Test en cours...</span>
            </div>
          ) : (
            'Tester l\'import'
          )}
        </Button>

        {uploading && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div>
                <div className="font-medium text-blue-800">Test d'import en cours...</div>
                <div className="text-sm text-blue-600">
                  Traitement simple sans timeout
                </div>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Test réussi !</span>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <p>• {result.totalRows} lignes traitées</p>
              <p>• {result.validTransactions} transactions valides</p>
              <p>• {result.insertedTransactions} transactions importées</p>
              <p>• {result.existingTransactions} transactions existantes avant import</p>
              <p>• {result.finalTransactions} transactions totales après import</p>
              <p>• <strong>{result.newTransactionsAdded} nouvelles transactions ajoutées</strong></p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">Erreur de test</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Format CSV attendu :</strong></p>
          <p>• Colonne 1: Transaction ID</p>
          <p>• Colonne 2: Date (optionnel)</p>
          <p>• Colonne 3: FRMSISDN</p>
          <p>• Colonne 4: TOMSISDN</p>
          <p>• Colonne 5: FR Profile</p>
          <p>• Colonne 6: TO Profile</p>
          <p>• Colonne 7: Transaction Type</p>
          <p>• Colonne 8: Original Amount</p>
          <p>• Colonne 9: Fee</p>
          <p>• Colonne 10: Commission</p>
        </div>
      </CardContent>
    </Card>
  );
}
