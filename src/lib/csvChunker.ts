export interface CsvChunkMeta {
  chunkIndex: number;
  totalChunksEstimate: number;
  linesInChunk: number;
}

// Découper un fichier CSV en chunks de N lignes (avec header répété)
// Lecture en streaming pour éviter de charger tout le fichier en mémoire
export async function chunkCsvFile(
  file: File,
  linesPerChunk: number,
  onChunk: (meta: CsvChunkMeta, chunkBlob: Blob) => Promise<void> | void
): Promise<{ totalChunks: number; totalLines: number }>
{
  const reader = (file.stream() as ReadableStream).getReader();
  const decoder = new TextDecoder();
  let { value, done } = await reader.read();
  let buffered = value ? decoder.decode(value, { stream: true }) : '';
  let headerLine = '';
  let headerCaptured = false;
  let currentLines: string[] = [];
  let chunkIndex = 0;
  let totalLines = 0;

  const flushChunk = async () => {
    if (currentLines.length === 0) return;
    const chunkText = headerCaptured
      ? [headerLine, ...currentLines].join('\n')
      : currentLines.join('\n');
    const blob = new Blob([chunkText], { type: 'text/csv' });
    await onChunk({ chunkIndex, totalChunksEstimate: Math.ceil(totalLines / linesPerChunk), linesInChunk: currentLines.length }, blob);
    chunkIndex += 1;
    currentLines = [];
  };

  while (!done) {
    ({ value, done } = await reader.read());
    const chunk = value ? decoder.decode(value, { stream: true }) : '';
    buffered += chunk;

    let newlineIndex: number;
    while ((newlineIndex = buffered.indexOf('\n')) >= 0) {
      const line = buffered.slice(0, newlineIndex).replace(/\r$/, '');
      buffered = buffered.slice(newlineIndex + 1);
      if (!headerCaptured) {
        headerLine = line;
        headerCaptured = true;
        continue;
      }
      totalLines += 1;
      currentLines.push(line);
      if (currentLines.length >= linesPerChunk) {
        await flushChunk();
      }
    }
  }

  // Reste du buffer (dernière ligne sans \n)
  if (buffered.length > 0) {
    if (!headerCaptured) {
      headerLine = buffered.replace(/\r$/, '');
      headerCaptured = true;
    } else {
      totalLines += 1;
      currentLines.push(buffered.replace(/\r$/, ''));
    }
  }

  await flushChunk();
  return { totalChunks: chunkIndex, totalLines };
}


