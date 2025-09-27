# Thème de Couleurs - Authentification

## Palette de Couleurs Utilisée

L'application utilise maintenant une palette de couleurs cohérente basée sur **orange**, **blanc** et **noir** pour toutes les pages d'authentification.

### 🎨 Couleurs Principales

- **Orange Principal** : `orange-500` à `orange-700`
- **Blanc** : `white` pour les cartes et éléments de contraste
- **Noir** : `black` pour les textes principaux
- **Gris** : `gray-500` à `gray-700` pour les textes secondaires

### 📱 Pages d'Authentification

#### 1. **Page de Connexion** (`/auth/signin`)
- **Arrière-plan** : Dégradé orange (`from-orange-500 via-orange-600 to-orange-700`)
- **Carte** : Fond blanc avec ombre
- **Bouton principal** : Dégradé orange
- **Champs de saisie** : Bordures orange au focus
- **Messages d'erreur** : Fond orange clair avec texte orange foncé

#### 2. **Page de Déconnexion** (`/auth/signout`)
- **Arrière-plan** : Dégradé orange identique
- **Carte** : Fond blanc avec ombre
- **Boutons** : Orange principal et blanc avec bordure orange
- **Redirection automatique** après 3 secondes

#### 3. **Page d'Erreur** (`/auth/error`)
- **Arrière-plan** : Dégradé orange identique
- **Icône** : Triangle d'alerte
- **Messages** : Personnalisés selon le type d'erreur
- **Boutons** : Retour à la connexion et accueil

#### 4. **Écrans de Chargement**
- **Arrière-plan** : Dégradé orange
- **Spinner** : Blanc avec animation
- **Messages** : Texte blanc et orange clair

#### 5. **Page d'Accès Refusé**
- **Arrière-plan** : Dégradé orange
- **Carte** : Fond blanc avec détails du rôle
- **Bouton** : Orange principal pour retour

### 🎯 Éléments de Design

#### **Icônes et Logos**
- **Cercle de fond** : `bg-white/20` avec bordure `border-white/30`
- **Icônes** : Couleur blanche pour le contraste
- **Taille** : `w-20 h-20` pour les logos principaux

#### **Boutons**
- **Principal** : `bg-gradient-to-r from-orange-500 to-orange-600`
- **Hover** : `hover:from-orange-600 hover:to-orange-700`
- **Secondaire** : Fond blanc avec bordure orange
- **Hauteur** : `h-12` pour tous les boutons

#### **Champs de Saisie**
- **Bordure** : `border-gray-300`
- **Focus** : `focus:border-orange-500 focus:ring-orange-500`
- **Texte** : `text-black` pour la lisibilité
- **Icônes** : `text-gray-500` avec hover orange

#### **Messages d'Erreur**
- **Fond** : `bg-orange-50`
- **Bordure** : `border-orange-200`
- **Texte** : `text-orange-800`

### 🔧 Classes CSS Utilisées

```css
/* Arrière-plan principal */
bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700

/* Cartes */
bg-white shadow-2xl rounded-2xl

/* Boutons principaux */
bg-gradient-to-r from-orange-500 to-orange-600
hover:from-orange-600 hover:to-orange-700

/* Boutons secondaires */
bg-white border-2 border-orange-500 text-orange-600
hover:bg-orange-50

/* Textes */
text-white (sur fond orange)
text-black (sur fond blanc)
text-gray-700 (textes secondaires)
text-orange-100 (textes sur fond orange)
```

### 📐 Structure des Pages

Toutes les pages d'authentification suivent la même structure :

1. **Container principal** : `min-h-screen` avec dégradé orange
2. **Logo/Titre** : Centré en haut avec icône dans un cercle
3. **Carte de contenu** : Fond blanc avec ombre et coins arrondis
4. **Boutons d'action** : Espacés verticalement
5. **Footer** : Texte informatif en bas

### 🎨 Cohérence Visuelle

- **Espacement** : `space-y-6` pour les éléments principaux
- **Padding** : `p-8` pour les cartes
- **Marges** : `mb-8` pour les sections
- **Bordures** : `border-2` pour les éléments importants
- **Ombres** : `shadow-2xl` pour les cartes principales

Cette palette de couleurs assure une expérience utilisateur cohérente et professionnelle sur toutes les pages d'authentification.
