# Configuration de l'Authentification

## Variables d'environnement requises

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Database
DATABASE_URL="file:./prisma/dev.db"
```

### Génération d'une clé secrète

Pour générer une clé secrète sécurisée, vous pouvez utiliser :

```bash
openssl rand -base64 32
```

Ou en ligne : https://generate-secret.vercel.app/32

## Création d'un utilisateur de test

Pour créer un utilisateur de test, exécutez :

```bash
npm run create-user
```

Cela créera un utilisateur avec :
- **Email** : admin@moovmoney.com
- **Mot de passe** : admin123
- **Rôle** : ADMIN

## Fonctionnalités d'authentification

### ✅ Implémentées

1. **Configuration NextAuth** avec authentification par credentials
2. **Middleware de protection** des routes
3. **SessionProvider** intégré dans le layout
4. **Composants d'authentification** :
   - Affichage des informations utilisateur dans la sidebar
   - Bouton de déconnexion
   - Composant ProtectedRoute pour protéger les pages
5. **Page de connexion** avec interface utilisateur moderne
6. **Gestion des rôles** (ADMIN/USER)
7. **Redirections** automatiques après connexion/déconnexion

### 🔧 Utilisation

#### Protection d'une page

```tsx
import ProtectedRoute from '@/components/ProtectedRoute'

export default function MaPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div>Contenu protégé</div>
    </ProtectedRoute>
  )
}
```

#### Vérification de session dans un composant

```tsx
import { useSession } from 'next-auth/react'

export default function MonComposant() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>Chargement...</div>
  if (!session) return <div>Non connecté</div>
  
  return <div>Bonjour {session.user.name}!</div>
}
```

## Sécurité

- Les mots de passe sont hachés avec bcrypt
- Les sessions utilisent JWT
- Le middleware protège automatiquement toutes les routes sauf `/auth/*`
- Les variables d'environnement sensibles ne sont pas exposées côté client

## Déploiement

Pour la production, assurez-vous de :

1. Changer `NEXTAUTH_URL` vers votre domaine
2. Utiliser une clé secrète forte
3. Configurer une base de données de production
4. Activer HTTPS
