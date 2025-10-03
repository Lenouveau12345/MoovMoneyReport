import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST SIMPLE ===');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log('Fichier reçu:', file ? `${file.name} (${file.size} bytes)` : 'AUCUN');

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Le fichier doit être un CSV' }, { status: 400 });
    }

    // Lire juste le début du fichier
    const text = await file.text();
    const firstLine = text.split('\n')[0];
    
    console.log('Première ligne:', firstLine);

    return NextResponse.json({
      message: 'Test simple réussi',
      fileName: file.name,
      fileSize: file.size,
      firstLine: firstLine,
      totalLines: text.split('\n').length
    });

  } catch (error) {
    console.error('Erreur test simple:', error);
    return NextResponse.json({ 
      error: 'Erreur test simple',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
