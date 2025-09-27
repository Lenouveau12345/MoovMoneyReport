# 🚀 Déploiement via Git + Vercel

Ce guide vous explique comment déployer votre application via Git avec des déploiements automatiques sur Vercel.

## 🎯 Avantages du Déploiement Git

- ✅ **Déploiements automatiques** à chaque push
- ✅ **Historique des versions** complet
- ✅ **Rollback facile** en cas de problème
- ✅ **Collaboration** en équipe
- ✅ **CI/CD intégré** avec Vercel

## 📋 Prérequis

- Compte GitHub
- Compte Vercel
- Base de données PostgreSQL (Neon, Supabase, ou Railway)

## 🔧 Étape 1 : Préparation du Repository

### 1.1 Vérifiez l'état actuel
```bash
git status
```

### 1.2 Utilisez le script de déploiement (optionnel)
```bash
npm run deploy:git
```

### 1.3 Ou faites-le manuellement :
```bash
# Ajoutez tous les fichiers
git add .

# Commitez les changements
git commit -m "Deploy to Vercel - Initial setup"

# Vérifiez la branche
git branch --show-current
```

## 🌐 Étape 2 : Configuration GitHub

### 2.1 Créez un repository sur GitHub
1. Allez sur [github.com](https://github.com)
2. Cliquez sur "New repository"
3. Nommez votre repo (ex: `moov-money-report`)
4. Choisissez "Public" ou "Private"
5. **Ne cochez PAS** "Initialize with README" (votre repo existe déjà)

### 2.2 Connectez votre repo local
```bash
# Ajoutez le remote GitHub
git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-REPO.git

# Poussez vers GitHub
git push -u origin main
```

**Note :** Si votre branche s'appelle `master` au lieu de `main` :
```bash
git push -u origin master
```

## 🚀 Étape 3 : Configuration Vercel

### 3.1 Connectez votre compte GitHub à Vercel
1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "Sign up" ou "Login"
3. Choisissez "Continue with GitHub"
4. Autorisez Vercel à accéder à vos repositories

### 3.2 Importez votre projet
1. Dans le dashboard Vercel, cliquez sur "New Project"
2. Sélectionnez votre repository `moov-money-report`
3. Cliquez sur "Import"

### 3.3 Configurez les paramètres de build
Vercel détectera automatiquement que c'est un projet Next.js :
- **Framework Preset :** Next.js
- **Root Directory :** `./` (par défaut)
- **Build Command :** `npm run build` (automatique)
- **Output Directory :** `.next` (automatique)

### 3.4 Configurez les variables d'environnement
Dans la section "Environment Variables", ajoutez :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `NEXTAUTH_URL` | `https://votre-app.vercel.app` | URL de votre application |
| `NEXTAUTH_SECRET` | `votre-clé-secrète-forte` | Clé secrète pour l'authentification |
| `DATABASE_URL` | `postgresql://...` | URL de votre base PostgreSQL |

**Pour générer une clé secrète forte :**
```bash
openssl rand -base64 32
```

### 3.5 Déployez
1. Cliquez sur "Deploy"
2. Attendez que le build se termine (2-3 minutes)
3. Votre application sera disponible à l'URL fournie

## 🗄️ Étape 4 : Configuration de la Base de Données

### 4.1 Créez une base PostgreSQL
**Option recommandée : Neon (gratuit)**
1. Allez sur [neon.tech](https://neon.tech)
2. Créez un compte gratuit
3. Créez un nouveau projet
4. Copiez l'URL de connexion

### 4.2 Appliquez les migrations
```bash
# Générez le client Prisma
npx prisma generate

# Appliquez les migrations
npx prisma db push

# Ou créez une migration
npx prisma migrate dev --name init
```

### 4.3 Créez un utilisateur administrateur
```bash
npm run create-user
```

## 🔄 Étape 5 : Déploiements Automatiques

### 5.1 Testez le déploiement automatique
1. Faites une modification dans votre code
2. Commitez et poussez :
   ```bash
   git add .
   git commit -m "Test automatic deployment"
   git push origin main
   ```
3. Vercel déploiera automatiquement !

### 5.2 Surveillez les déploiements
- Allez sur votre dashboard Vercel
- Cliquez sur votre projet
- Voir l'onglet "Deployments" pour l'historique

## 🛠️ Commandes Utiles

### Scripts de déploiement
```bash
# Script automatisé de déploiement Git
npm run deploy:git

# Déploiement direct via Vercel CLI
npm run deploy

# Configuration initiale
npm run deploy:setup
```

### Commandes Git
```bash
# Voir l'état
git status

# Ajouter tous les fichiers
git add .

# Commiter avec un message
git commit -m "Votre message"

# Pousser vers GitHub
git push origin main

# Voir l'historique
git log --oneline
```

### Commandes Vercel
```bash
# Voir les logs
vercel logs

# Voir les variables d'environnement
vercel env ls

# Ajouter une variable d'environnement
vercel env add NOM_VARIABLE
```

## 🔍 Surveillance et Maintenance

### Logs de déploiement
- **Vercel Dashboard** → Votre projet → Deployments
- **GitHub Actions** (si configuré)

### Variables d'environnement
- **Vercel Dashboard** → Votre projet → Settings → Environment Variables

### Base de données
- **Neon Dashboard** → Votre projet → Database
- **Logs de requêtes** disponibles dans Neon

## 🆘 Dépannage

### Problème : Build échoue
1. Vérifiez les logs dans Vercel Dashboard
2. Testez localement : `npm run build`
3. Vérifiez les variables d'environnement

### Problème : Base de données non accessible
1. Vérifiez `DATABASE_URL` dans Vercel
2. Testez la connexion depuis votre machine
3. Vérifiez que la base accepte les connexions externes

### Problème : Authentification ne fonctionne pas
1. Vérifiez `NEXTAUTH_URL` (doit correspondre exactement à votre domaine)
2. Vérifiez `NEXTAUTH_SECRET`
3. Regardez les logs Vercel pour les erreurs

### Problème : Import CSV ne fonctionne pas
1. Vérifiez les logs Vercel
2. Assurez-vous que les migrations sont appliquées
3. Testez avec un petit fichier CSV

## 📈 Optimisations

### Performance
- Vercel utilise automatiquement un CDN global
- Les images sont optimisées automatiquement
- Les API routes sont serverless

### Sécurité
- Variables d'environnement sécurisées
- HTTPS automatique
- Headers de sécurité configurés

### Monitoring
- Analytics Vercel (gratuit)
- Logs en temps réel
- Métriques de performance

---

🎉 **Félicitations !** Votre application est maintenant déployée avec des déploiements automatiques via Git !

## 📞 Support

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation GitHub](https://docs.github.com)
- [Documentation Prisma](https://www.prisma.io/docs)
