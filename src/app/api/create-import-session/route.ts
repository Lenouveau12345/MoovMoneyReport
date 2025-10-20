import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileSize } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'Nom de fichier requis' }, { status: 400 });
    }

    // Créer une session d'import
    const importSession = await prisma.importSession.create({
      data: {
        fileName: fileName,
        fileSize: fileSize || 0,
        totalRows: 0,
        validRows: 0,
        importedRows: 0,
        status: 'PARTIAL',
      }
    });

    console.log('📋 Session d\'import créée:', importSession.id, 'pour le fichier:', fileName);

    return NextResponse.json({
      importSessionId: importSession.id,
      message: 'Session d\'import créée avec succès'
    });

  } catch (error: any) {
    console.error('Erreur lors de la création de la session d\'import:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création de la session d\'import',
      details: error.message 
    }, { status: 500 });
  }
}
