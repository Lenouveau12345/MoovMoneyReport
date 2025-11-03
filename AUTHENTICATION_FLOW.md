# Flux d'Authentification - T-REPORT

## 🔐 Structure de Sécurité

L'application utilise maintenant un système d'authentification complet qui protège toutes les pages sensibles.

### 📱 Pages Accessibles

#### **Pages Publiques** (sans authentification)
- `/landing` - Page d'accueil publique avec présentation
- `/auth/signin` - Page de connexion
- `/auth/signout` - Page de déconnexion
- `/auth/error` - Page d'erreur d'authentification

#### **Pages Protégées** (authentification requise)
- `/` - Tableau de bord principal
- `/import-csv` - Import de fichiers CSV
- `/rapport-periodique` - Rapports périodiques
- `/tendances` - Analyses de tendances
- `/historique-imports` - Historique des imports
- `/transactions` - Consultation des transactions

### 🔄 Flux d'Authentification

#### **1. Utilisateur Non Connecté**
```
Utilisateur accède à une page protégée
    ↓
Middleware NextAuth intercepte la requête
    ↓
Redirection vers /landing
    ↓
Page d'accueil publique avec bouton "Se connecter"
    ↓
Clic sur "Se connecter" → /auth/signin
```

#### **2. Processus de Connexion**
```
Page de connexion (/auth/signin)
    ↓
Saisie des identifiants
    ↓
Vérification avec NextAuth
    ↓
Si succès → Redirection vers /
Si échec → Affichage du message d'erreur
```

#### **3. Utilisateur Connecté**
```
Accès à toutes les pages protégées
    ↓
SidebarLayout vérifie la session
    ↓
Affichage de l'interface complète
    ↓
Informations utilisateur dans la sidebar
```

### 🛡️ Composants de Protection

#### **1. Middleware (`middleware.ts`)**
- Intercepte toutes les requêtes
- Redirige vers `/landing` si pas de token
- Autorise l'accès aux pages publiques

#### **2. SidebarLayout (`src/components/SidebarLayout.tsx`)**
- Vérifie la session utilisateur
- Affiche un écran de chargement pendant la vérification
- Redirige vers `/landing` si pas de session
- Affiche la sidebar uniquement pour les utilisateurs connectés

#### **3. ProtectedRoute (`src/components/ProtectedRoute.tsx`)**
- Composant pour protéger des pages spécifiques
- Gestion des rôles (ADMIN/USER)
- Écrans de chargement et d'erreur personnalisés

#### **4. Page d'Accueil (`src/app/page.tsx`)**
- Vérification de session au chargement
- Redirection automatique si pas connecté
- Écran de chargement avec thème orange

### 🎨 Pages d'Authentification

Toutes les pages d'authentification utilisent le thème **orange**, **blanc** et **noir** :

#### **Page de Connexion** (`/auth/signin`)
- Arrière-plan : Dégradé orange
- Carte : Fond blanc
- Bouton : Dégradé orange
- Messages d'erreur : Thème orange

#### **Page d'Accueil Publique** (`/landing`)
- Présentation de l'application
- Boutons d'action vers la connexion
- Design cohérent avec le thème orange
- Redirection automatique si déjà connecté

#### **Pages d'Erreur et Déconnexion**
- Design cohérent avec le thème
- Messages personnalisés
- Navigation intuitive

### 🔧 Configuration

#### **Variables d'Environnement** (`.env.local`)
```env
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL="file:./prisma/dev.db"
```

#### **Utilisateur de Test**
```bash
npm run create-user
```
- Email: `admin@moovmoney.com`
- Mot de passe: `admin123`
- Rôle: `ADMIN`

### 🚀 Utilisation

#### **Pour les Développeurs**
1. Créer le fichier `.env.local` avec les variables
2. Exécuter `npm run create-user` pour créer un utilisateur test
3. Démarrer le serveur avec `npm run dev`
4. Accéder à `http://localhost:3001`

#### **Pour les Utilisateurs**
1. Accéder à l'application
2. Être redirigé vers la page d'accueil publique
3. Cliquer sur "Se connecter"
4. Saisir les identifiants
5. Accéder au tableau de bord

### 🔒 Sécurité

- ✅ Protection de toutes les routes sensibles
- ✅ Vérification de session sur chaque page
- ✅ Redirections automatiques
- ✅ Gestion des rôles utilisateur
- ✅ Messages d'erreur sécurisés
- ✅ Sessions JWT sécurisées
- ✅ Mots de passe hachés avec bcrypt

### 📱 Expérience Utilisateur

- ✅ Interface cohérente et moderne
- ✅ Écrans de chargement élégants
- ✅ Messages d'erreur clairs
- ✅ Navigation intuitive
- ✅ Design responsive
- ✅ Thème de couleurs uniforme

Cette structure garantit que seuls les utilisateurs authentifiés peuvent accéder aux fonctionnalités de l'application, tout en offrant une expérience utilisateur fluide et sécurisée.
