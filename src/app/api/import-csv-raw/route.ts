import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

// Cette route reçoit { rows: Array<Record<string,string>> }
// et insère directement dans la table transactions en respectant l'unicité de transactionId.
// Aucun autre traitement n'est appliqué.

function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(String(value).replace(/\s/g, '').replace(/,/g, '.'));
  return Number.isFinite(n) ? n : 0;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let rows: Array<Record<string, string>> = [];

    if (contentType.includes('multipart/form-data')) {
      // Mode fichier (chunks)
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
      }

      // Parser le CSV du chunk
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
      // Mode JSON direct
      const body = await request.json();
      rows = (body?.rows ?? []) as Array<Record<string, string>>;
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Aucune ligne fournie' }, { status: 400 });
    }

    // On mappe naïvement les colonnes attendues. Aucun enrichissement.
    const data = rows.map((r) => ({
      transactionId: r['transactionId'] ?? r['TransactionId'] ?? r['id'] ?? r['ID'] ?? '',
      transactionInitiatedTime: new Date(r['transactionInitiatedTime'] ?? r['date'] ?? r['Date'] ?? Date.now()),
      frmsisdn: r['frmsisdn'] ?? r['from'] ?? r['From'] ?? '',
      tomsisdn: r['tomsisdn'] ?? r['to'] ?? r['To'] ?? '',
      frName: r['frName'] ?? r['fromName'] ?? null,
      toName: r['toName'] ?? r['toName'] ?? null,
      frProfile: r['frProfile'] ?? r['fromProfile'] ?? '',
      toProfile: r['toProfile'] ?? r['toProfile'] ?? '',
      transactionType: r['transactionType'] ?? r['type'] ?? '',
      originalAmount: toNumber(r['originalAmount'] ?? r['amount'] ?? r['Amount']),
      fee: toNumber(r['fee'] ?? r['Fee']),
      commissionAll: toNumber(r['commissionAll'] ?? r['commission'] ?? r['Commission']),
      merchantsOnlineCashIn: r['merchantsOnlineCashIn'] ?? r['merchant'] ?? '',
    })).filter(d => d.transactionId);

    if (data.length === 0) {
      return NextResponse.json({ error: 'Aucune ligne valide' }, { status: 400 });
    }

    // Insertion en lots, en ignorant les doublons sur la contrainte unique.
    // Le schéma peut être différent selon l’environnement du repo. On tente les deux stratégies:
    // 1) unique sur transactionId seul (skipDuplicates fonctionne sur unique/indexs composés)
    // 2) si unique composite (transactionId, importSessionId), comme importSessionId est null par défaut,
    //    Neon rejettera les doublons sur (transactionId, null) également.

    const created = await prisma.transaction.createMany({
      data,
      skipDuplicates: true,
    });

    return NextResponse.json({ inserted: created.count });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 });
  }
}




