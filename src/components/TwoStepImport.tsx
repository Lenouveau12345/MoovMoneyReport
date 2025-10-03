'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, AlertCircle, Play, Clock, Database } from 'lucide-react';

interface UploadedFile {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  status: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'DELETED';
  uploadedAt: string;
  processedAt?: string;
  importSession?: {
    id: string;
    totalRows: number;
    validRows: number;
    importedRows: number;
    status: string;
  };
}

interface ProcessResult {
  fileId: string;
  totalRows: number;
  validTransactions: number;
  insertedTransactions: number;
  duplicatesSkipped: number;
  errors: string[];
  importSessionId: string;
}

export default function TwoStepImport() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadedFile(null);
      setProcessResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Normaliser la structure de l'objet uploadedFile
        const normalizedFile = {
          id: data.fileId,
          fileName: data.fileName,
          originalName: data.originalName,
          fileSize: data.fileSize,
          status: data.status,
          uploadedAt: data.uploadedAt,
        };
        setUploadedFile(normalizedFile);
        console.log('Fichier uploadé:', normalizedFile);
      } else {
        setError(data.error || 'Erreur lors de l\'upload');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!uploadedFile) {
      console.error('Aucun fichier uploadé disponible');
      setError('Aucun fichier uploadé disponible');
      return;
    }

    console.log('Traitement du fichier:', uploadedFile);
    console.log('File ID à envoyer:', uploadedFile.id);

    setProcessing(true);
    setError(null);

    try {
      const requestBody = { fileId: uploadedFile.id };
      console.log('Corps de la requête:', requestBody);

      const response = await fetch('/api/process-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setProcessResult(data);
        console.log('Fichier traité:', data);
        
        // Recharger les infos du fichier pour mettre à jour le statut
        const fileResponse = await fetch(`/api/process-file?fileId=${uploadedFile.id}`);
        const fileData = await fileResponse.json();
        if (fileResponse.ok) {
          setUploadedFile(fileData.file);
        }
      } else {
        setError(data.error || 'Erreur lors du traitement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPLOADED': return 'text-blue-600 bg-blue-100';
      case 'PROCESSING': return 'text-yellow-600 bg-yellow-100';
      case 'PROCESSED': return 'text-green-600 bg-green-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UPLOADED': return <Upload className="w-4 h-4" />;
      case 'PROCESSING': return <Clock className="w-4 h-4" />;
      case 'PROCESSED': return <CheckCircle className="w-4 h-4" />;
      case 'FAILED': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Import en Deux Étapes
          </CardTitle>
          <CardDescription>
            Étape 1: Upload du fichier sur le serveur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="two-step-file" className="text-sm font-medium">
              Sélectionner un fichier CSV
            </label>
            <input
              id="two-step-file"
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
                <span>Upload en cours...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Étape 1: Uploader le fichier</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {uploadedFile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Fichier Uploadé
            </CardTitle>
            <CardDescription>
              Étape 2: Traitement et import en base de données
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">{uploadedFile.originalName}</div>
                  <div className="text-sm text-green-600">
                    {(uploadedFile.fileSize / 1024).toFixed(1)} KB • ID: {uploadedFile.id}
                  </div>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(uploadedFile.status)}`}>
                {getStatusIcon(uploadedFile.status)}
                {uploadedFile.status}
              </div>
            </div>

            {uploadedFile.status === 'UPLOADED' && (
              <Button
                onClick={handleProcess}
                disabled={processing}
                className="w-full"
              >
                {processing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Traitement en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    <span>Étape 2: Traiter et importer</span>
                  </div>
                )}
              </Button>
            )}

            {uploadedFile.status === 'PROCESSED' && uploadedFile.importSession && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Import terminé !</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>• {uploadedFile.importSession.totalRows} lignes traitées</p>
                  <p>• {uploadedFile.importSession.validRows} transactions valides</p>
                  <p>• {uploadedFile.importSession.importedRows} transactions importées</p>
                  <p>• Session ID: {uploadedFile.importSession.id}</p>
                </div>
              </div>
            )}

            {uploadedFile.status === 'FAILED' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800">Échec du traitement</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {processResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              Résultat du Traitement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Lignes traitées:</strong> {processResult.totalRows}</p>
                <p><strong>Transactions valides:</strong> {processResult.validTransactions}</p>
              </div>
              <div>
                <p><strong>Transactions importées:</strong> {processResult.insertedTransactions}</p>
                <p><strong>Doublons ignorés:</strong> {processResult.duplicatesSkipped}</p>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <p><strong>Session ID:</strong> {processResult.importSessionId}</p>
            </div>
            
            {processResult.errors.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-medium text-yellow-800 mb-2">Erreurs rencontrées:</div>
                <div className="text-sm text-yellow-700 space-y-1">
                  {processResult.errors.map((error, index) => (
                    <p key={index}>• {error}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Erreur</span>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Avantages de l'import en deux étapes :</strong></p>
        <p>• Évite les timeouts sur les gros fichiers</p>
        <p>• Permet de vérifier le fichier avant traitement</p>
        <p>• Traitement asynchrone plus fiable</p>
        <p>• Possibilité de retraiter un fichier uploadé</p>
      </div>
    </div>
  );
}
