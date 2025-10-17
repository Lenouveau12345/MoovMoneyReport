# Configuration de la base de données

## Pour passer à PostgreSQL (Neon)

1. Créer un fichier `.env` à la racine du projet avec :
```
DATABASE_URL="postgresql://username:password@ep-cool-dawn-adwueiaq-pooler.c-2.us-east-1.aws.neon.tech:5432/neondb?sslmode=require"
```

2. Remplacer l'URL par votre vraie URL de connexion Neon

3. Exécuter les migrations :
```bash
npx prisma migrate dev --name switch-to-postgresql
npx prisma generate
```

4. Redémarrer l'application
