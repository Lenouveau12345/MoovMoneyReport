import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    console.log('=== UPLOAD FICHIER ===');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Le fichier doit être un CSV' }, { status: 400 });
    }

    console.log('Fichier reçu:', file.name, '(', file.size, 'bytes)');

    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
      console.log('Dossier uploads créé');
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}_${randomId}.csv`;
    const filePath = join(uploadsDir, fileName);

    // Sauvegarder le fichier sur le disque
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log('Fichier sauvegardé:', filePath);

    // Enregistrer les informations en base de données
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        fileName: fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        filePath: filePath,
        status: 'UPLOADED',
      }
    });

    console.log('Fichier enregistré en DB:', uploadedFile.id);

    return NextResponse.json({
      message: 'Fichier uploadé avec succès',
      fileId: uploadedFile.id,
      fileName: uploadedFile.fileName,
      originalName: uploadedFile.originalName,
      fileSize: uploadedFile.fileSize,
      status: uploadedFile.status,
      uploadedAt: uploadedFile.uploadedAt,
    });

  } catch (error) {
    console.error('=== ERREUR UPLOAD FICHIER ===');
    console.error('Type d\'erreur:', typeof error);
    console.error('Message:', error instanceof Error ? error.message : error);
    console.error('Stack:', error instanceof Error ? error.stack : 'Pas de stack');
    
    return NextResponse.json({ 
      error: 'Erreur lors de l\'upload du fichier',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Récupérer la liste des fichiers uploadés
    const uploadedFiles = await prisma.uploadedFile.findMany({
      orderBy: { uploadedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      files: uploadedFiles,
      count: uploadedFiles.length,
    });

  } catch (error) {
    console.error('Erreur récupération fichiers:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des fichiers',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
