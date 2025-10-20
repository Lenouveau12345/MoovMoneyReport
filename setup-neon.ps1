# Script PowerShell pour configurer la connexion à Neon
# Usage: .\setup-neon.ps1

Write-Host "🔧 Configuration de la connexion à Neon..." -ForegroundColor Green

# Vérifier si le fichier .env.local existe
if (Test-Path ".env.local") {
    Write-Host "⚠️  Le fichier .env.local existe déjà." -ForegroundColor Yellow
    $response = Read-Host "Voulez-vous le remplacer? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "❌ Configuration annulée." -ForegroundColor Red
        exit
    }
}

# Demander l'URL de connexion Neon
Write-Host ""
Write-Host "📋 Veuillez fournir votre URL de connexion Neon:" -ForegroundColor Cyan
Write-Host "   Format: postgresql://username:password@host:port/database?sslmode=require" -ForegroundColor Gray
$neonUrl = Read-Host "URL de connexion Neon"

if ([string]::IsNullOrWhiteSpace($neonUrl)) {
    Write-Host "❌ URL vide. Configuration annulée." -ForegroundColor Red
    exit
}

# Créer le fichier .env.local
$envContent = @"
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production

# Database - Neon PostgreSQL
DATABASE_URL="$neonUrl"

# Configuration pour les uploads
UPLOAD_TIMEOUT=300000
SSL_RETRY_COUNT=3
CHUNK_SIZE=10000
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "✅ Fichier .env.local créé avec succès!" -ForegroundColor Green

# Générer le client Prisma
Write-Host ""
Write-Host "🔄 Génération du client Prisma..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Client Prisma généré avec succès!" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la génération du client Prisma." -ForegroundColor Red
    exit 1
}

# Tester la connexion
Write-Host ""
Write-Host "🔍 Test de la connexion à Neon..." -ForegroundColor Yellow
node test-neon-connection.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Configuration terminée avec succès!" -ForegroundColor Green
    Write-Host "   Vous pouvez maintenant démarrer l'application avec: npm run dev" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "⚠️  Il y a eu des problèmes avec la connexion." -ForegroundColor Yellow
    Write-Host "   Vérifiez votre URL de connexion Neon et réessayez." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📖 Pour plus d'informations, consultez: setup-neon-connection.md" -ForegroundColor Blue
