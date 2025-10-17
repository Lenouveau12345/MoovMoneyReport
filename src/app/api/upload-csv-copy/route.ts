import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { from as copyFrom } from 'pg-copy-streams';
import { Readable } from 'stream';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// NOTE: Nécessite DATABASE_URL (Neon Postgres) et runtime Node (pas Edge)

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(request: NextRequest) {
  let client: any = null;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Le fichier doit être un CSV' }, { status: 400 });
    }

    // Créer une table de staging temporaire (session)
    client = await pool.connect();
    await client.query('BEGIN');

    // Table staging avec toutes les colonnes possibles
    await client.query(`
      CREATE TEMP TABLE IF NOT EXISTS transactions_staging (
        transactionId text,
        transactionInitiatedTime timestamp,
        frmsisdn text,
        tomsisdn text,
        frName text,
        toName text,
        frProfile text,
        toProfile text,
        transactionType text,
        originalAmount double precision,
        fee double precision,
        commissionAll double precision,
        merchantsOnlineCashIn text,
        commissionDistributeur double precision,
        commissionMarchand double precision,
        commissionRevendeur double precision,
        commissionSousDistributeur double precision
      ) ON COMMIT DROP;
    `);

    // COPY FROM STDIN - laisser PostgreSQL mapper automatiquement les colonnes
    const copyQuery = `COPY transactions_staging FROM STDIN WITH (FORMAT csv, HEADER true)`;

    const copyStream = client.query(copyFrom(copyQuery));
    // COPY accepte un stream Node; certains runtimes n'exposent pas WebStream -> fallback Buffer
    const webStream = file.stream?.() as any;
    const fileStream = webStream && Readable.fromWeb ? Readable.fromWeb(webStream) : Readable.from(Buffer.from(await file.arrayBuffer()));

    await new Promise<void>((resolve, reject) => {
      fileStream.pipe(copyStream)
        .on('finish', () => resolve())
        .on('error', (err: any) => reject(err));
    });

    // Insérer en base avec déduplication via ON CONFLICT
    const insertSql = `
      INSERT INTO transactions (
        id, transactionId, transactionInitiatedTime, frmsisdn, tomsisdn,
        frName, toName, frProfile, toProfile, transactionType,
        originalAmount, fee, commissionAll, merchantsOnlineCashIn,
        commissionDistributeur, commissionMarchand, commissionRevendeur, commissionSousDistributeur,
        createdAt, updatedAt
      )
      SELECT 
        gen_random_uuid(), transactionId, transactionInitiatedTime, frmsisdn, tomsisdn,
        frName, toName, frProfile, toProfile, transactionType,
        COALESCE(originalAmount, 0), COALESCE(fee, 0), COALESCE(commissionAll, 0), merchantsOnlineCashIn,
        commissionDistributeur, commissionMarchand, commissionRevendeur, commissionSousDistributeur,
        now(), now()
      FROM transactions_staging
      WHERE transactionId IS NOT NULL AND frmsisdn IS NOT NULL AND tomsisdn IS NOT NULL
      ON CONFLICT (transactionId) DO NOTHING
      RETURNING transactionId;
    `;
    const result = await client.query(insertSql);

    await client.query('COMMIT');
    return NextResponse.json({
      message: 'Import COPY réussi',
      inserted: result.rowCount ?? 0,
    });
  } catch (error: any) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch {}
    }
    return NextResponse.json({ error: error?.message || 'Erreur COPY' }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}


