# Configuration de la Connexion à Neon

## Étapes pour connecter votre application locale à Neon

### 1. Créer le fichier .env.local

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production

# Database - Neon PostgreSQL
# Remplacez cette URL par votre vraie URL de connexion Neon
DATABASE_URL="postgresql://username:password@ep-cool-dawn-adwueiaq-pooler.c-2.us-east-1.aws.neon.tech:5432/neondb?sslmode=require"

# Configuration pour les uploads
UPLOAD_TIMEOUT=300000
SSL_RETRY_COUNT=3
CHUNK_SIZE=10000
```

### 2. Remplacer l'URL de la base de données

**IMPORTANT** : Remplacez l'URL dans `DATABASE_URL` par votre vraie URL de connexion Neon.

Vous pouvez trouver votre URL de connexion dans votre dashboard Neon :
1. Allez sur https://console.neon.tech/
2. Sélectionnez votre projet
3. Allez dans "Connection Details"
4. Copiez l'URL de connexion PostgreSQL

### 3. Exécuter les migrations

Une fois le fichier `.env.local` créé avec la bonne URL, exécutez :

```bash
# Générer le client Prisma pour PostgreSQL
npx prisma generate

# Appliquer les migrations à la base Neon
npx prisma migrate dev --name switch-to-postgresql

# Ou si vous voulez juste synchroniser le schéma
npx prisma db push
```

### 4. Redémarrer l'application

```bash
# Arrêter le serveur actuel (Ctrl+C)
# Puis redémarrer
npm run dev
```

### 5. Vérifier la connexion

Une fois redémarré, l'application devrait maintenant être connectée à votre base de données Neon et afficher les données existantes.

## Résolution de problèmes

### Si vous obtenez une erreur de connexion :

1. **Vérifiez l'URL** : Assurez-vous que l'URL Neon est correcte
2. **Vérifiez les credentials** : Username et password doivent être corrects
3. **Vérifiez la région** : L'URL doit pointer vers la bonne région Neon

### Si vous obtenez une erreur de schéma :

```bash
# Forcer la synchronisation du schéma
npx prisma db push --force-reset

# Puis regénérer le client
npx prisma generate
```

### Si vous voulez conserver les données SQLite :

Si vous avez des données importantes dans votre base SQLite locale, vous pouvez les exporter avant de passer à Neon :

```bash
# Exporter les données SQLite (optionnel)
npx prisma db seed
```

## Vérification

Une fois configuré, vous devriez voir dans les logs de l'application :
- Connexion à PostgreSQL au lieu de SQLite
- Les données existantes dans votre base Neon
- Le nombre de transactions > 0 dans les statistiques

## Notes importantes

- Le fichier `.env.local` n'est pas versionné (dans .gitignore)
- Assurez-vous de ne jamais commiter vos vraies credentials
- Pour la production, utilisez les variables d'environnement de votre plateforme de déploiement
