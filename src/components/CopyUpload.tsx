'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, AlertCircle, Database } from 'lucide-react';
import ChunkedUploadControls from '@/components/ChunkedUploadControls';

interface UploadResult {
  message: string;
  inserted: number;
}

interface CopyUploadProps {
  onImportSuccess?: () => void;
}

export default function CopyUpload({ onImportSuccess }: CopyUploadProps) {
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

      const response = await fetch('/api/upload-csv-copy', {
        method: 'POST',
        body: formData,
      });

      const ct = response.headers.get('content-type') || '';
      const payload = ct.includes('application/json') ? await response.json() : { error: await response.text() };
      if (!response.ok) throw new Error(payload?.error || `HTTP ${response.status}`);

      setResult(payload);
      onImportSuccess?.();
    } catch (e: any) {
      setError(e?.message || 'Erreur import COPY');
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
      <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          Import COPY (Postgres)
        </CardTitle>
        <CardDescription>
          Stream du CSV vers Postgres via COPY, insertion dédupliquée via ON CONFLICT
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un fichier CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
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

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full h-12 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700"
        >
          {uploading ? 'Import COPY en cours...' : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Importer via COPY
            </>
          )}
        </Button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Import COPY réussi !</span>
            </div>
            <div className="text-sm">Lignes insérées: {result.inserted.toLocaleString()}</div>
          </div>
        )}

        {file && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Mode découpage (10 000 lignes par chunk)</h4>
            <ChunkedUploadControls
              file={file}
              linesPerChunk={10000}
              endpoint="/api/upload-csv-copy"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}


