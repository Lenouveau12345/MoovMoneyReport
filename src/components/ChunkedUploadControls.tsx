'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { chunkCsvFile } from '@/lib/csvChunker';

interface ChunkedUploadControlsProps {
  file: File;
  linesPerChunk?: number;
  endpoint: string; // ex: /api/upload-csv-raw, /api/upload-csv-copy, etc.
  onProgress?: (p: { processedChunks: number; totalChunks: number; inserted?: number }) => void;
  onDone?: (summary: { totalChunks: number; totalLines: number; insertedTotal: number }) => void;
}

export default function ChunkedUploadControls({ file, linesPerChunk = 10000, endpoint, onProgress, onDone }: ChunkedUploadControlsProps) {
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [inserted, setInserted] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setRunning(true);
    setProcessed(0);
    setInserted(0);
    setError(null);
    let insertedTotal = 0;
    const meta = await chunkCsvFile(file, linesPerChunk, async (m, blob) => {
      setTotal(m.totalChunksEstimate);
      const formData = new FormData();
      formData.append('file', blob, `${file.name}.part${m.chunkIndex}.csv`);
      const res = await fetch(endpoint, { method: 'POST', body: formData });
      let inc = 0;
      try {
        const ct = res.headers.get('content-type') || '';
        const payload = ct.includes('application/json') ? await res.json() : { inserted: 0 };
        inc = Number(payload?.inserted || payload?.insertedTransactions || 0);
      } catch {}
      insertedTotal += inc;
      setInserted((v) => v + inc);
      setProcessed((v) => v + 1);
      onProgress?.({ processedChunks: m.chunkIndex + 1, totalChunks: m.totalChunksEstimate, inserted: insertedTotal });
    });
    setRunning(false);
    onDone?.({ totalChunks: meta.totalChunks, totalLines: meta.totalLines, insertedTotal });
  };

  const percent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700">Chunks traités: {processed} / {total} — Insertions: {inserted.toLocaleString()}</div>
      <Progress value={percent} />
      <div className="flex gap-2">
        <Button onClick={start} disabled={running}>{running ? 'En cours...' : 'Démarrer découpage + import'}</Button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}


