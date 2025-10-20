# Script pour configurer l'URL Neon
Write-Host "🔧 Configuration de l'URL de connexion Neon" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Étapes pour obtenir votre URL Neon:" -ForegroundColor Cyan
Write-Host "   1. Allez sur https://console.neon.tech/" -ForegroundColor White
Write-Host "   2. Connectez-vous à votre compte" -ForegroundColor White
Write-Host "   3. Sélectionnez votre projet" -ForegroundColor White
Write-Host "   4. Allez dans 'Connection Details' ou 'Connect'" -ForegroundColor White
Write-Host "   5. Copiez l'URL de connexion PostgreSQL" -ForegroundColor White
Write-Host ""

Write-Host "💡 L'URL ressemble à ceci:" -ForegroundColor Yellow
Write-Host "   postgresql://username:password@ep-project-pooler.region.aws.neon.tech:5432/database?sslmode=require" -ForegroundColor Gray
Write-Host ""

$neonUrl = Read-Host "Collez votre URL de connexion Neon ici"

if ([string]::IsNullOrWhiteSpace($neonUrl)) {
    Write-Host "❌ URL vide. Configuration annulée." -ForegroundColor Red
    exit
}

# Créer le contenu du fichier .env.local
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

# Écrire le fichier
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host ""
Write-Host "✅ Fichier .env.local mis à jour avec succès!" -ForegroundColor Green
Write-Host ""

# Tester la connexion
Write-Host "🔍 Test de la connexion..." -ForegroundColor Yellow
node test-neon-connection-simple.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Configuration terminée avec succès!" -ForegroundColor Green
    Write-Host "   Vous pouvez maintenant démarrer l'application avec: npm run dev" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "⚠️ Il y a eu des problèmes avec la connexion." -ForegroundColor Yellow
    Write-Host "   Vérifiez votre URL de connexion et réessayez." -ForegroundColor Yellow
}
