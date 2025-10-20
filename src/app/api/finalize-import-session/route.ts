import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { importSessionId, totalRows, validRows, importedRows, status, errorMessage } = body;

    if (!importSessionId) {
      return NextResponse.json({ error: 'ID de session d\'import requis' }, { status: 400 });
    }

    // Mettre à jour la session d'import
    const updatedSession = await prisma.importSession.update({
      where: { id: importSessionId },
      data: {
        totalRows: totalRows || 0,
        validRows: validRows || 0,
        importedRows: importedRows || 0,
        status: status || 'SUCCESS',
        errorMessage: errorMessage || null,
      }
    });

    console.log('✅ Session d\'import finalisée:', importSessionId, 'Statut:', status);

    return NextResponse.json({
      message: 'Session d\'import finalisée avec succès',
      importSession: updatedSession
    });

  } catch (error: any) {
    console.error('Erreur lors de la finalisation de la session d\'import:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la finalisation de la session d\'import',
      details: error.message 
    }, { status: 500 });
  }
}
