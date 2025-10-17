'use client';

import { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload, SendHorizonal, Trash2 } from 'lucide-react';
import ChunkedUploadControls from '@/components/ChunkedUploadControls';

interface LocalPreviewUploadProps {
  onImportSuccess?: () => void;
}

type RowObject = Record<string, string>;

export default function LocalPreviewUpload({ onImportSuccess }: LocalPreviewUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<RowObject[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setRows([]);
    setHeaders([]);
    setSentCount(0);
    setError(null);
  };

  const parseCsv = async () => {
    if (!file) return;
    setParsing(true);
    setError(null);
    try {
      const text = await file.text();
      const result = Papa.parse<RowObject>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
      });
      if (result.errors && result.errors.length > 0) {
        setError('Erreur lors du parsing du CSV');
        setParsing(false);
        return;
      }
      const data = (result.data || []) as RowObject[];
      const cols = data.length > 0 ? Object.keys(data[0]) : [];
      setHeaders(cols);
      setRows(data);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inconnue lors de la lecture du fichier');
    } finally {
      setParsing(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setRows([]);
    setHeaders([]);
    setSentCount(0);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const totalRows = rows.length;
  const progress = useMemo(() => {
    if (totalRows === 0) return 0;
    return Math.round((sentCount / totalRows) * 100);
  }, [sentCount, totalRows]);

  const sendAll = async () => {
    if (rows.length === 0) return;
    setSending(true);
    setError(null);
    setSentCount(0);
    try {
      const BATCH_SIZE = 1000;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const res = await fetch('/api/import-csv-raw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: batch }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || 'Erreur API lors de l\'insertion');
        }
        setSentCount((prev) => prev + batch.length);
      }
      onImportSuccess?.();
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inconnue lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Upload className="h-5 w-5 text-orange-600" />
          Import Local (Aperçu + Envoi)
        </CardTitle>
        <CardDescription>
          Charge le CSV côté navigateur, affiche un aperçu, puis envoie en base.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="csv-local-file" className="text-sm font-medium">
            Sélectionner un fichier CSV
          </label>
          <input
            ref={inputRef}
            id="csv-local-file"
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
            <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={parseCsv} disabled={!file || parsing} className="w-full">
            {parsing ? 'Analyse...' : 'Charger et afficher'}
          </Button>
          <Button variant="outline" onClick={clearAll} disabled={parsing || sending}>
            <Trash2 className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        </div>

        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        {headers.length > 0 && (
          <div className="overflow-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((r, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {headers.map((h) => (
                      <td key={h} className="px-3 py-2 whitespace-nowrap text-gray-900">{r[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 200 && (
              <div className="text-xs text-gray-500 p-2">{rows.length - 200} lignes supplémentaires non affichées...</div>
            )}
          </div>
        )}

        {rows.length > 0 && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-orange-600 h-2.5 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{sentCount} / {totalRows} lignes envoyées</span>
              <span>{progress}%</span>
            </div>
            <Button onClick={sendAll} disabled={sending} className="w-full">
              {sending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Envoi en cours...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <SendHorizonal className="h-4 w-4" />
                  <span>Envoyer les lignes</span>
                </div>
              )}
            </Button>
          </div>
        )}

        {file && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Mode découpage (10 000 lignes par chunk)</h4>
            <ChunkedUploadControls
              file={file}
              linesPerChunk={10000}
              endpoint="/api/import-csv-raw"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}




