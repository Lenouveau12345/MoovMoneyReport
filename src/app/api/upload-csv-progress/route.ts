export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mémoire de progression en process (simple pour dev/local)
type ProgressStatus = {
  status: 'processing' | 'completed' | 'error';
  message: string;
  total: number;
  processed: number;
  progress: number; // 0-100
  error?: string;
  result?: {
    totalRows: number;
    validTransactions: number;
    insertedTransactions: number;
  };
};

const progressStore = new Map<string, ProgressStatus>();

// Parser CSV simple pour une ligne
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Transformer une ligne CSV en objet Transaction
function parseTransactionRow(headers: string[], values: string[]) {
  const row: any = {};
  headers.forEach((header, index) => {
    row[header.trim()] = values[index]?.trim() || '';
  });

        // Parser la date - format: 02/05/2025 00:03:00
        let transactionDate = new Date();
  const dateString = row['Transaction Initiated Time'];
        if (dateString) {
          const dateOnly = dateString.split(' ')[0];
          const [day, month, year] = dateOnly.split('/');
          if (day && month && year) {
            transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
        }

        return {
    transactionId: (row['Transaction ID'] || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).toString().trim(),
          transactionInitiatedTime: transactionDate,
    frmsisdn: (row['FRMSISDN'] || '').toString().trim(),
    tomsisdn: (row['TOMSISDN'] || '').toString().trim(),
    frProfile: (row['FRPROFILE'] || '').toString().trim(),
    toProfile: (row['TOPROFILE'] || '').toString().trim(),
    transactionType: (row['Transaction Type'] || '').toString().trim(),
    originalAmount: parseFloat(row['Original Amount'] || '0'),
    fee: parseFloat(row['Fee'] || '0'),
    commissionAll: parseFloat(row['Commission ALL'] || '0'),
    commissionDistributeur: parseFloat(row['COMMISSION_DISTRIBUTEUR'] || '0') || null,
    commissionSousDistributeur: parseFloat(row['COMMISSION_SOUS_DISTRIBUTEUR'] || '0') || null,
    commissionRevendeur: parseFloat(row['COMMISSION_REVENDEUR'] || '0') || null,
    commissionMarchand: parseFloat(row['COMMISSION_MARCHAND'] || '0') || null,
    merchantsOnlineCashIn: (row['MSISDN_MARCHAND'] || '').toString().trim(),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const importId = searchParams.get('importId') || searchParams.get('sessionId');
  if (!importId) {
    return new Response(JSON.stringify({ error: 'importId manquant' }), { status: 400 });
  }
  const status = progressStore.get(importId);
  if (!status) {
    return new Response(JSON.stringify({ error: 'Session inconnue' }), { status: 404 });
  }
  return new Response(JSON.stringify(status), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: NextRequest) {
  // Créer une session et démarrer le traitement asynchrone
  const importId = crypto.randomUUID();
  
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      throw new Error('Fichier manquant');
    }

    // Créer une session d'import en base
    const importSession = await prisma.importSession.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        totalRows: 0, // sera mis à jour
        validRows: 0,
        importedRows: 0,
        // Ne pas définir de statut non supporté; laisser la valeur par défaut (SUCCESS)
      }
    });

    // Initialiser la progression
    progressStore.set(importId, {
      status: 'processing',
      message: 'Initialisation du traitement...',
      total: 0,
      processed: 0,
      progress: 0,
    });

    // Démarrer le traitement asynchrone (sans await pour ne pas bloquer la réponse)
    processFileAsync(importId, file, importSession.id).catch(async (error) => {
      console.error('Erreur dans processFileAsync:', error);
      
      // Mettre à jour la session d'import en cas d'erreur
      try {
        await prisma.importSession.update({
          where: { id: importSession.id },
          data: {
            status: 'FAILED',
            errorMessage: error?.message || 'Erreur inconnue',
          }
        });
      } catch (updateError) {
        console.error('Erreur lors de la mise à jour de la session:', updateError);
      }
      
      progressStore.set(importId, {
        status: 'error',
        message: 'Échec du traitement',
        total: 0,
        processed: 0,
        progress: 0,
        error: error?.message || 'Erreur inconnue',
      });
    });

    return new Response(JSON.stringify({ importId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    progressStore.set(importId, {
      status: 'error',
      message: 'Échec du traitement',
      total: 0,
      processed: 0,
      progress: 0,
      error: error?.message || 'Erreur inconnue',
    });
    return new Response(JSON.stringify({ error: 'Erreur lors du démarrage du traitement' }), { status: 500 });
  }
}

async function processFileAsync(importId: string, file: File, importSessionId: string) {
  let totalRows = 0;
  let validTransactions = 0;
  let insertedTransactions = 0;
  let headers: string[] = [];
  let isFirstLine = true;
  let batch: any[] = [];
  const BATCH_SIZE = 1000; // Traiter par lots de 1000
      
      // Mettre à jour la progression
  const updateProgress = (message: string) => {
    const progressPct = totalRows > 0 ? Math.min(99, Math.floor((insertedTransactions / totalRows) * 100)) : 0;
    progressStore.set(importId, {
      status: 'processing',
      message,
      total: totalRows,
      processed: insertedTransactions,
      progress: progressPct,
    });
  };

  try {
    updateProgress('Lecture du fichier...');
    console.log(`[${importId}] Début du traitement du fichier: ${file.name} (${file.size} bytes)`);

    // Lire en streaming
    const readable = file.stream();
    const reader = readable.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      let lastNewline = buffer.lastIndexOf('\n');
      if (lastNewline === -1) continue;

      const chunk = buffer.slice(0, lastNewline);
      buffer = buffer.slice(lastNewline + 1);

      const lines = chunk.split(/\r?\n/);
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        if (isFirstLine) {
          // Première ligne = en-têtes
          headers = parseCSVLine(line);
          console.log(`[${importId}] En-têtes détectés:`, headers);
          isFirstLine = false;
          continue;
        }

        totalRows++;
        
        try {
          const values = parseCSVLine(line);
          const transaction = parseTransactionRow(headers, values);
          
          // Log de débogage pour les premières lignes
          if (totalRows <= 3) {
            console.log(`[${importId}] Ligne ${totalRows}:`, { values, transaction });
          }
          
          // Valider la transaction
          if (transaction.transactionId && 
              !isNaN(transaction.originalAmount) && 
              transaction.originalAmount > 0 &&
              !isNaN(transaction.transactionInitiatedTime.getTime())) {
            
            batch.push({
              ...transaction,
              importSessionId,
            });
            validTransactions++;

            // Insérer par batch
            if (batch.length >= BATCH_SIZE) {
              console.log(`[${importId}] Insertion batch de ${batch.length} transactions`);
              const insertedCount = await insertBatch(batch);
              insertedTransactions += insertedCount;
              batch = [];
              
              updateProgress(`Traitement en cours... ${insertedTransactions} transactions insérées`);
            }
          } else {
            if (totalRows <= 3) {
              console.log(`[${importId}] Transaction invalide ligne ${totalRows}:`, {
                transactionId: transaction.transactionId,
                originalAmount: transaction.originalAmount,
                date: transaction.transactionInitiatedTime
              });
            }
          }
        } catch (error) {
          console.error(`[${importId}] Erreur parsing ligne ${totalRows}:`, error);
        }
      }
    }

    // Traiter le reste du buffer
    if (buffer.trim()) {
      if (!isFirstLine) {
        totalRows++;
        try {
          const values = parseCSVLine(buffer.trim());
          const transaction = parseTransactionRow(headers, values);
          
          if (transaction.transactionId && 
              !isNaN(transaction.originalAmount) && 
              transaction.originalAmount > 0 &&
              !isNaN(transaction.transactionInitiatedTime.getTime())) {
            
            batch.push({
              ...transaction,
              importSessionId,
            });
            validTransactions++;
          }
        } catch (error) {
          console.error('Erreur parsing dernière ligne:', error);
        }
      }
    }

    // Insérer le dernier batch
    if (batch.length > 0) {
      const insertedCount = await insertBatch(batch);
      insertedTransactions += insertedCount;
    }

    // Mettre à jour la session d'import
    await prisma.importSession.update({
      where: { id: importSessionId },
      data: {
        totalRows,
        validRows: validTransactions,
        importedRows: insertedTransactions,
        status: insertedTransactions === validTransactions ? 'SUCCESS' : 'PARTIAL',
      }
    });

    // Finaliser
    const final: ProgressStatus = {
      status: 'completed',
      message: 'Import terminé',
      total: totalRows,
      processed: insertedTransactions,
      progress: 100,
      result: {
        totalRows,
        validTransactions,
        insertedTransactions,
      },
    };
    progressStore.set(importId, final);

  } catch (error: any) {
    console.error('Erreur lors du traitement:', error);
    
    // Mettre à jour la session d'import en erreur
    try {
      await prisma.importSession.update({
        where: { id: importSessionId },
        data: {
          status: 'FAILED',
          errorMessage: error?.message || 'Erreur inconnue',
          totalRows,
          validRows: validTransactions,
          importedRows: insertedTransactions,
        }
      });
    } catch (updateError) {
      console.error('Erreur lors de la mise à jour de la session en erreur:', updateError);
    }

    progressStore.set(importId, {
      status: 'error',
      message: 'Échec du traitement',
      total: totalRows,
      processed: insertedTransactions,
      progress: 0,
      error: error?.message || 'Erreur inconnue',
    });
  }
}

async function insertBatch(batch: any[]): Promise<number> {
  try {
    console.log(`Insertion batch de ${batch.length} transactions en base (skip duplicates)...`);
    const result = await prisma.transaction.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(`Batch: ${result.count} nouvelles transactions insérées (doublons ignorés automatiquement)`);
    return result.count ?? 0;
  } catch (error) {
    console.error('Erreur lors de l\'insertion du batch:', error);
    return 0;
  }
}