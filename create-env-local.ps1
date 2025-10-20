# Script pour créer le fichier .env.local avec l'URL Neon
# Remplacez l'URL par votre vraie URL de connexion Neon

$envContent = @"
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production

# Database - Neon PostgreSQL
# IMPORTANT: Remplacez cette URL par votre vraie URL de connexion Neon
DATABASE_URL="postgresql://username:password@ep-cool-dawn-adwueiaq-pooler.c-2.us-east-1.aws.neon.tech:5432/neondb?sslmode=require"

# Configuration pour les uploads
UPLOAD_TIMEOUT=300000
SSL_RETRY_COUNT=3
CHUNK_SIZE=10000
"@

# Créer le fichier .env.local
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "✅ Fichier .env.local créé avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Remplacez l'URL DATABASE_URL par votre vraie URL Neon!" -ForegroundColor Yellow
Write-Host "   Vous pouvez la trouver dans votre dashboard Neon:" -ForegroundColor Cyan
Write-Host "   https://console.neon.tech/" -ForegroundColor Blue
Write-Host ""
Write-Host "📋 Étapes suivantes:" -ForegroundColor Cyan
Write-Host "   1. Éditez le fichier .env.local avec votre vraie URL Neon" -ForegroundColor White
Write-Host "   2. Exécutez: npx prisma generate" -ForegroundColor White
Write-Host "   3. Exécutez: npx prisma migrate dev --name switch-to-postgresql" -ForegroundColor White
Write-Host "   4. Redémarrez l'application: npm run dev" -ForegroundColor White
