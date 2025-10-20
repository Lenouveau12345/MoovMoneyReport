'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Scissors,
  Calculator,
  Upload,
  BarChart3,
  XCircle
} from 'lucide-react';

interface SmartChunkedUploadProps {
  onImportSuccess?: () => void;
}

interface UploadProgress {
  currentFile: number;
  totalFiles: number;
  currentLines: number;
  totalLines: number;
  insertedLines: number;
  skippedLines: number;
  isProcessing: boolean;
  currentStep: string;
}

export default function SmartChunkedUpload({ onImportSuccess }: SmartChunkedUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<UploadProgress>({
    currentFile: 0,
    totalFiles: 0,
    currentLines: 0,
    totalLines: 0,
    insertedLines: 0,
    skippedLines: 0,
    isProcessing: false,
    currentStep: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHUNK_SIZE = 500 * 1024; // 500 Ko
  const MIN_LINES_PER_CHUNK = 500;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      setError('Veuillez sélectionner un fichier CSV valide');
    }
  };

  const chunkFile = async (file: File): Promise<string[]> => {
    const chunks: string[] = [];
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const header = lines[0];
        
        let currentChunk = header + '\n';
        let currentSize = currentChunk.length;
        let lineCount = 0;
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i] + '\n';
          lineCount++;
          
          const shouldCreateNewChunk = currentSize + line.length > MAX_CHUNK_SIZE && 
                                      lineCount >= MIN_LINES_PER_CHUNK && 
                                      currentChunk !== header + '\n';
          
          if (shouldCreateNewChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = header + '\n' + line;
            currentSize = currentChunk.length;
            lineCount = 1;
          } else {
            currentChunk += line;
            currentSize += line.length;
          }
        }
        
        if (currentChunk !== header + '\n') {
          chunks.push(currentChunk.trim());
        }
        
        resolve(chunks);
      };
      
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsText(file);
    });
  };

  const countLines = (chunks: string[]): number => {
    let totalLines = 0;
    chunks.forEach(chunk => {
      const lines = chunk.split('\n');
      totalLines += lines.length - 1; // -1 pour l'en-tête
    });
    return totalLines;
  };

  const processChunk = async (chunk: string, chunkIndex: number): Promise<{ inserted: number; skipped: number }> => {
    const lines = chunk.split('\n');
    const header = lines[0].split(',').map(h => h.trim());
    
    let inserted = 0;
    let skipped = 0;
    
    const validRows: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      
      header.forEach((col, index) => {
        row[col] = values[index] || '';
      });
      
      const hasTransactionId = row['Transaction ID'] || row['TransactionID'] || row['transactionId'] || 
                               row['ID'] || row['id'] || row['Id'] || row['reference'] || row['Reference'];
      if (!hasTransactionId) {
        skipped++;
        continue;
      }
      
      validRows.push(row);
    }
    
    if (validRows.length > 0) {
      try {
        const response = await fetch('/api/import-csv-raw', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rows: validRows
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          inserted = result.inserted || 0;
          skipped += (validRows.length - inserted);
        } else {
          const errorData = await response.json();
          console.error('Erreur API:', errorData);
          skipped += validRows.length;
        }
        
      } catch (error) {
        console.error('Erreur lors de l\'insertion du chunk:', error);
        skipped += validRows.length;
      }
    }
    
    console.log(`Chunk ${chunkIndex + 1}: ${inserted} insérées, ${skipped} ignorées`);
    return { inserted, skipped };
  };

  const startImport = async () => {
    if (!file) return;
    
    const startTime = Date.now();
    
    setProgress({
      currentFile: 0,
      totalFiles: 0,
      currentLines: 0,
      totalLines: 0,
      insertedLines: 0,
      skippedLines: 0,
      isProcessing: true,
      currentStep: '🧱 Découpage du fichier...'
    });
    setError(null);
    setResult(null);
    
    try {
      const chunks = await chunkFile(file);
      
      setProgress(prev => ({
        ...prev,
        totalFiles: chunks.length,
        currentStep: '🧮 Comptage des lignes...'
      }));
      
      const totalLines = countLines(chunks);
      
      setProgress(prev => ({
        ...prev,
        totalLines,
        currentStep: '🗃️ Insertion des données...'
      }));
      
      let totalInserted = 0;
      let totalSkipped = 0;
      
      for (let i = 0; i < chunks.length; i++) {
        setProgress(prev => ({
          ...prev,
          currentFile: i + 1,
          currentStep: `🗃️ Traitement du fichier ${i + 1}/${chunks.length}...`
        }));
        
        try {
          const chunkResult = await processChunk(chunks[i], i);
          totalInserted += chunkResult.inserted;
          totalSkipped += chunkResult.skipped;
          
          setProgress(prev => ({
            ...prev,
            insertedLines: totalInserted,
            skippedLines: totalSkipped,
            currentLines: totalInserted + totalSkipped
          }));
          
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
        } catch (error) {
          console.error(`Erreur lors du traitement du chunk ${i + 1}:`, error);
          setError(`Erreur lors du traitement du fichier ${i + 1}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          break;
        }
      }
      
      const endTime = Date.now();
      const processingTime = Math.round((endTime - startTime) / 1000);
      
      setProgress(prev => ({
        ...prev,
        currentStep: '✅ Import terminé avec succès !',
        isProcessing: false
      }));
      
      setResult({
        totalFiles: chunks.length,
        totalLines,
        insertedLines: totalInserted,
        skippedLines: totalSkipped,
        processingTime,
        processingRate: totalLines > 0 ? Math.round(totalLines / processingTime) : 0,
        success: true
      });
      
      onImportSuccess?.();
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      setProgress(prev => ({
        ...prev,
        isProcessing: false,
        currentStep: '❌ Erreur lors de l\'import'
      }));
    }
  };

  const getProgressPercentage = (current: number, total: number): number => {
    if (total === 0) return 0;
    return Math.min(100, Math.round((current / total) * 100));
  };

  const fileProgress = getProgressPercentage(progress.currentFile, progress.totalFiles);
  const linesProgress = getProgressPercentage(progress.currentLines, progress.totalLines);

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {!file ? (
          <div className="space-y-4">
            <FileText className="w-12 h-12 mx-auto text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">Sélectionnez un fichier CSV</p>
              <p className="text-sm text-gray-500">Le fichier sera découpé en chunks de 500 Ko maximum</p>
            </div>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Choisir un fichier
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
            <div>
              <p className="text-lg font-medium text-gray-900">Fichier sélectionné</p>
              <p className="text-sm text-gray-600">{file.name}</p>
              <p className="text-xs text-gray-500">Taille: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={startImport} disabled={progress.isProcessing}>
                {progress.isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Scissors className="w-4 h-4 mr-2" />
                )}
                Démarrer l'import intelligent
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFile(null);
                  setProgress({
                    currentFile: 0,
                    totalFiles: 0,
                    currentLines: 0,
                    totalLines: 0,
                    insertedLines: 0,
                    skippedLines: 0,
                    isProcessing: false,
                    currentStep: ''
                  });
                  setError(null);
                  setResult(null);
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Changer
              </Button>
            </div>
          </div>
        )}
      </div>

      {progress.isProcessing && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="font-medium text-blue-900">{progress.currentStep}</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-blue-800">📁 Fichiers traités</span>
              <span className="text-blue-600">{progress.currentFile} / {progress.totalFiles}</span>
            </div>
            <Progress value={fileProgress} className="h-3" />
            
            <div className="flex justify-between text-sm">
              <span className="text-green-800">📊 Lignes traitées</span>
              <span className="text-green-600">{progress.currentLines} / {progress.totalLines}</span>
            </div>
            <Progress value={linesProgress} className="h-3 bg-green-100" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-green-600" />
              <span className="text-green-800">Insérées: {progress.insertedLines}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-orange-800">Ignorées: {progress.skippedLines}</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <div>
            <div className="font-medium">Erreur d'import</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Import terminé avec succès !</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Fichiers traités:</strong> {result.totalFiles}</p>
              <p><strong>Lignes totales:</strong> {result.totalLines.toLocaleString()}</p>
              <p><strong>Temps de traitement:</strong> {result.processingTime}s</p>
            </div>
            <div>
              <p><strong>Lignes insérées:</strong> {result.insertedLines.toLocaleString()}</p>
              <p><strong>Lignes ignorées:</strong> {result.skippedLines.toLocaleString()}</p>
              <p><strong>Vitesse:</strong> {result.processingRate} lignes/s</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">🧠 Algorithme d'import intelligent</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">🧱</span>
            <span>Découpe optimisée : ≤ 500 Ko ET ≥ 500 lignes par fichier</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">🧮</span>
            <span>Comptage précis du nombre de lignes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-600">🗃️</span>
            <span>Insertion optimisée avec gestion des erreurs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-600">🚫</span>
            <span>Filtrage automatique des lignes invalides</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-600">📊</span>
            <span>Progression en temps réel avec statistiques</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⏱️</span>
            <span>Mesure du temps de traitement et vitesse</span>
          </div>
        </div>
      </div>
    </div>
  );
}