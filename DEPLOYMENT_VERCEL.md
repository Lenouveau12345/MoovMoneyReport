# 🚀 Guide de Déploiement sur Vercel

Ce guide vous explique comment déployer l'application T-Report sur Vercel.

## 📋 Prérequis

- Compte Vercel (gratuit)
- Compte pour une base de données PostgreSQL (recommandé: Neon, Supabase, ou Railway)
- Git configuré sur votre machine

## 🗄️ Étape 1 : Configuration de la Base de Données

### Option A : Neon (Recommandé - Gratuit)
1. Allez sur [neon.tech](https://neon.tech)
2. Créez un compte gratuit
3. Créez un nouveau projet
4. Copiez l'URL de connexion PostgreSQL

### Option B : Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Allez dans Settings > Database
4. Copiez l'URI de connexion

### Option C : Railway
1. Allez sur [railway.app](https://railway.app)
2. Créez un nouveau projet
3. Ajoutez une base de données PostgreSQL
4. Copiez l'URL de connexion

## 🔧 Étape 2 : Configuration Locale

1. **Installez Vercel CLI** (si pas déjà fait) :
   ```bash
   npm install -g vercel
   ```

2. **Exécutez le script de configuration** :
   ```bash
   npm run deploy:setup
   ```

3. **Créez un fichier .env.local** pour les tests :
   ```bash
   cp .env.example .env.local
   ```

4. **Modifiez .env.local** avec vos vraies valeurs :
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-super-secret-key-here
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

## 🚀 Étape 3 : Déploiement sur Vercel

### Méthode 1 : Via Vercel CLI (Recommandé)

1. **Connectez-vous à Vercel** :
   ```bash
   vercel login
   ```

2. **Initialisez le projet** :
   ```bash
   vercel
   ```
   - Suivez les instructions à l'écran
   - Choisissez votre organisation
   - Acceptez les paramètres par défaut

3. **Configurez les variables d'environnement** :
   ```bash
   vercel env add NEXTAUTH_URL
   vercel env add NEXTAUTH_SECRET
   vercel env add DATABASE_URL
   ```
   - Pour `NEXTAUTH_URL` : `https://votre-app.vercel.app`
   - Pour `NEXTAUTH_SECRET` : une clé secrète forte
   - Pour `DATABASE_URL` : votre URL PostgreSQL

4. **Déployez en production** :
   ```bash
   npm run deploy
   ```

### Méthode 2 : Via GitHub (Automatique)

1. **Poussez votre code sur GitHub** :
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connectez votre repo à Vercel** :
   - Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
   - Cliquez sur "New Project"
   - Importez votre repository GitHub
   - Configurez les variables d'environnement dans l'interface

## 🗃️ Étape 4 : Configuration de la Base de Données

1. **Générez le client Prisma** :
   ```bash
   npm run db:generate
   ```

2. **Appliquez les migrations** :
   ```bash
   npm run db:migrate
   ```

3. **Créez un utilisateur administrateur** :
   ```bash
   npm run create-user
   ```

## 🔐 Étape 5 : Configuration de l'Authentification

1. **Générez une clé secrète forte** :
   ```bash
   openssl rand -base64 32
   ```

2. **Configurez NEXTAUTH_SECRET** dans Vercel avec cette clé

3. **Configurez NEXTAUTH_URL** avec l'URL de votre application Vercel

## ✅ Étape 6 : Vérification

1. **Visitez votre application** : `https://votre-app.vercel.app`

2. **Connectez-vous** avec :
   - Email : `admin@moovmoney.com`
   - Mot de passe : `admin123`

3. **Testez l'import CSV** pour vérifier que tout fonctionne

## 🔄 Déploiements Futurs

Pour déployer des mises à jour :

```bash
git add .
git commit -m "Update application"
git push origin main
```

Vercel déploiera automatiquement si vous utilisez la méthode GitHub.

## 🛠️ Commandes Utiles

```bash
# Voir les logs de déploiement
vercel logs

# Voir les variables d'environnement
vercel env ls

# Déployer une prévisualisation
vercel

# Déployer en production
vercel --prod
```

## 🆘 Dépannage

### Problème : Erreur de base de données
- Vérifiez que `DATABASE_URL` est correct
- Assurez-vous que la base de données est accessible depuis Vercel

### Problème : Erreur d'authentification
- Vérifiez `NEXTAUTH_URL` et `NEXTAUTH_SECRET`
- Assurez-vous que l'URL correspond exactement à votre domaine Vercel

### Problème : Import CSV ne fonctionne pas
- Vérifiez les logs Vercel : `vercel logs`
- Assurez-vous que les migrations de base de données sont appliquées

## 📞 Support

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation NextAuth](https://next-auth.js.org)

---

🎉 **Félicitations !** Votre application T-Report est maintenant déployée sur Vercel !
