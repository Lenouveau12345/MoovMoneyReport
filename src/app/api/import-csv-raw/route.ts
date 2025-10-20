import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { insertTransactionsWithUpsert } from '@/lib/database';

export const revalidate = 0;

function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(String(value).replace(/\s/g, '').replace(/,/g, '.'));
  return Number.isFinite(n) ? n : 0;
}

function detectColumn(row: any, possibleNames: string[]): string | null {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name];
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  let importSessionId: string | null = null;
  
  try {
    const contentType = request.headers.get('content-type') || '';
    let rows: Array<Record<string, string>> = [];
    let fileName = 'unknown';
    let fileSize = 0;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const providedSessionId = formData.get('importSessionId') as string;
      
      if (!file) {
        return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
      }

      fileName = file.name;
      fileSize = file.size;
      importSessionId = providedSessionId || null;

      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        return NextResponse.json({ error: 'Fichier vide' }, { status: 400 });
      }

      const headers = lines[0].split(',').map(h => h.trim());
      rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      });
    } else {
      const body = await request.json();
      rows = (body?.rows ?? []) as Array<Record<string, string>>;
      fileName = body?.fileName || 'smart-import';
      fileSize = body?.fileSize || 0;
      importSessionId = body?.importSessionId || null;
    }

    if (!importSessionId) {
      const importSession = await prisma.importSession.create({
        data: {
          fileName: fileName,
          fileSize: fileSize,
          totalRows: 0,
          validRows: 0,
          importedRows: 0,
          status: 'PARTIAL',
        }
      });
      importSessionId = importSession.id;
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Aucune ligne fournie' }, { status: 400 });
    }

    console.log('🔍 En-têtes CSV détectés:', Object.keys(rows[0] || {}));
    console.log('📊 Nombre de lignes reçues:', rows.length);

    const data = rows.map((record) => {
      const transactionId = detectColumn(record, [
        'Transaction ID', 'TransactionID', 'transactionId', 'TRANSACTION ID', 'TRANSACTION_ID',
        'ID', 'id', 'Id', 'reference', 'Reference', 'REFERENCE', 'txn_id', 'TXN_ID'
      ]);
      
      const transactionTime = detectColumn(record, [
        'Transaction Initiated Time', 'TransactionInitiatedTime', 'transactionInitiatedTime',
        'Transaction Initiated', 'date', 'Date', 'DATE', 'timestamp', 'created_at'
      ]);
      
      const frmsisdn = detectColumn(record, [
        'FRMSISDN', 'frmsisdn', 'from_msisdn', 'fromMsisdn', 'FROM_MSISDN', 'from'
      ]) || '';
      
      const tomsisdn = detectColumn(record, [
        'TOMSISDN', 'tomsisdn', 'to_msisdn', 'toMsisdn', 'TO_MSISDN', 'to'
      ]) || '';
      
      const originalAmount = detectColumn(record, [
        'Original Amount', 'OriginalAmount', 'originalAmount', 'ORIGINAL AMOUNT',
        'amount', 'Amount', 'AMOUNT', 'value', 'montant'
      ]) || '0';
      
      const transaction = {
        transactionId: transactionId,
        transactionInitiatedTime: new Date(transactionTime || new Date()),
        frmsisdn: frmsisdn,
        tomsisdn: tomsisdn,
        frName: detectColumn(record, ['FR_NAME', 'FRNAME', 'FR NAME', 'fr_name', 'from_name', 'fromName']),
        toName: detectColumn(record, ['TO_NAME', 'TONAME', 'TO NAME', 'to_name', 'receiver_name', 'toName']),
        frProfile: detectColumn(record, ['FR_PROFILE', 'FRPROFILE', 'FR PROFILE', 'fr_profile', 'from_profile', 'fromProfile']) || '',
        toProfile: detectColumn(record, ['TO_PROFILE', 'TOPROFILE', 'TO PROFILE', 'to_profile', 'receiver_profile', 'toProfile']) || '',
        transactionType: detectColumn(record, ['Transaction Type', 'TransactionType', 'transactionType', 'TRANSACTION TYPE', 'type', 'Type', 'TYPE', 'operation_type']) || '',
        originalAmount: toNumber(originalAmount),
        fee: toNumber(detectColumn(record, ['Fee', 'fee', 'FEE', 'fees', 'Fees']) || '0'),
        commissionAll: toNumber(detectColumn(record, ['Commission ALL', 'CommissionALL', 'commissionAll', 'COMMISSION ALL', 'commission', 'Commission', 'total_commission']) || '0'),
        merchantsOnlineCashIn: detectColumn(record, ['MSISDN_MARCHAND', 'msisdn_marchand', 'merchant_msisdn', 'merchantMsisdn', 'merchant']) || '',
      };

      if (transaction.transactionId && 
          !isNaN(transaction.originalAmount) && 
          transaction.originalAmount >= 0 &&
          !isNaN(transaction.transactionInitiatedTime.getTime())) {
        return transaction;
      }
      
      return null;
    }).filter(t => t !== null);

    console.log('✅ Lignes valides après mapping:', data.length);
    console.log('🔍 Exemple de ligne mappée:', data[0]);

    if (data.length === 0) {
      console.log('❌ Aucune ligne valide - vérifiez les en-têtes CSV');
      console.log('🔍 Exemple de ligne originale:', rows[0]);
      console.log('🔍 Colonnes détectées dans la première ligne:', Object.keys(rows[0] || {}));
      
      const sampleRow = rows[0] || {};
      console.log('🔍 Analyse de la première ligne:');
      console.log('  - TransactionID détecté:', detectColumn(sampleRow, ['Transaction ID', 'TransactionID', 'transactionId', 'TRANSACTION ID', 'TRANSACTION_ID', 'ID', 'id', 'reference', 'Reference', 'REFERENCE', 'txn_id', 'TXN_ID']));
      console.log('  - Original Amount détecté:', detectColumn(sampleRow, ['Original Amount', 'OriginalAmount', 'originalAmount', 'ORIGINAL AMOUNT', 'amount', 'Amount', 'AMOUNT', 'value', 'montant']));
      console.log('  - Toutes les colonnes disponibles:', Object.keys(sampleRow));
      
      return NextResponse.json({ 
        error: 'Aucune ligne valide - vérifiez les en-têtes CSV',
        availableColumns: Object.keys(sampleRow),
        sampleRow: sampleRow
      }, { status: 400 });
    }

    const dataWithSession = data.map(transaction => ({
      ...transaction,
      importSessionId: importSessionId
    }));

    const result = await insertTransactionsWithUpsert(dataWithSession);

    return NextResponse.json({ 
      inserted: result.inserted,
      ignored: result.ignored,
      importSessionId: importSessionId
    });
  } catch (e: any) {
    if (importSessionId) {
      try {
        await prisma.importSession.update({
          where: { id: importSessionId },
          data: {
            status: 'FAILED',
            errorMessage: e?.message || 'Erreur inconnue',
          }
        });
      } catch (updateError) {
        console.error('Erreur lors de la mise à jour de la session:', updateError);
      }
    }
    
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 });
  }
}