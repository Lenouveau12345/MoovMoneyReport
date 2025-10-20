# 🧠 Algorithme d'Import Intelligent

## Vue d'ensemble

L'Import Intelligent suit un algorithme précis en 6 étapes pour optimiser le traitement des gros fichiers CSV avec une expérience utilisateur exceptionnelle.

## 📋 Algorithme Détaillé

| Étape | Description | Implémentation |
|-------|-------------|----------------|
| 🧱 **1** | **Découpe** le gros CSV en fichiers ≤ 500 Ko, avec barre de progression | `chunkFile()` - Découpage intelligent avec préservation des en-têtes |
| 🧮 **2** | **Compte** le nombre total de lignes à insérer | `countLines()` - Comptage précis ligne par ligne |
| 🗃️ **3** | **Insère** chaque chunk dans `transactions` en respectant les colonnes | `processChunk()` - Insertion optimisée avec mapping automatique |
| 🚫 **4** | Ignore les lignes sans `TransactionID` | Filtrage automatique des lignes invalides |
| 📊 **5** | Affiche **2 barres de progression** : fichiers et lignes | Interface temps réel avec statistiques détaillées |
| ✅ **6** | Ferme proprement la connexion PostgreSQL | Gestion propre des ressources et nettoyage |

## 🔧 Fonctionnalités Techniques

### Découpage Intelligent (Étape 1)
```typescript
const MAX_CHUNK_SIZE = 500 * 1024; // 500 Ko
```
- **Préservation des en-têtes** : Chaque chunk contient l'en-tête CSV
- **Découpage optimal** : Respecte la limite de 500 Ko par chunk
- **Gestion des lignes incomplètes** : Évite de couper les données au milieu

### Comptage Précis (Étape 2)
- **Comptage ligne par ligne** : Précision maximale
- **Exclusion des en-têtes** : Seules les lignes de données sont comptées
- **Mise à jour temps réel** : Affichage immédiat du nombre total

### Insertion Optimisée (Étape 3)
- **Mapping automatique** : Reconnaissance des colonnes courantes
- **Validation des données** : Vérification de la cohérence
- **Gestion des erreurs** : Retry automatique en cas d'échec

### Filtrage Intelligent (Étape 4)
```typescript
// Reconnaissance automatique des identifiants de transaction
if (!row.TransactionID && !row.transactionId && !row.ID && !row.id) {
  skipped++;
  continue;
}
```
- **Détection flexible** : Reconnaît plusieurs formats d'ID
- **Comptage des ignorés** : Statistiques précises des lignes filtrées

### Interface Temps Réel (Étape 5)
- **Double barre de progression** :
  - 📁 Progression des fichiers traités
  - 📊 Progression des lignes traitées
- **Statistiques en temps réel** :
  - Lignes insérées
  - Lignes ignorées
  - Vitesse de traitement

### Gestion Propre (Étape 6)
- **Nettoyage des ressources** : Fermeture propre des connexions
- **Rapport final** : Statistiques complètes de l'import
- **Gestion des erreurs** : Messages d'erreur détaillés

## 🎯 Avantages de l'Algorithme

### Performance
- **Découpage optimal** : Chunks de 500 Ko pour équilibrer vitesse et stabilité
- **Traitement parallèle** : Chaque chunk est traité indépendamment
- **Gestion mémoire** : Évite la surcharge mémoire sur les gros fichiers

### Fiabilité
- **Validation stricte** : Vérification de chaque ligne avant insertion
- **Gestion d'erreurs** : Retry automatique et messages détaillés
- **Filtrage intelligent** : Élimination automatique des données corrompues

### Expérience Utilisateur
- **Feedback temps réel** : Progression visuelle et statistiques
- **Interface intuitive** : Design clair et informatif
- **Gestion des erreurs** : Messages d'erreur compréhensibles

## 🔄 Mapping des Colonnes

L'algorithme reconnaît automatiquement ces formats de colonnes :

| Champ | Formats Reconnus |
|-------|------------------|
| Transaction ID | `TransactionID`, `transactionId`, `ID`, `id` |
| Date | `TransactionInitiatedTime`, `transactionInitiatedTime`, `date`, `Date` |
| De | `FRMSISDN`, `frmsisdn`, `from`, `From` |
| À | `TOMSISDN`, `tomsisdn`, `to`, `To` |
| Montant | `OriginalAmount`, `originalAmount`, `amount`, `Amount` |
| Frais | `Fee`, `fee`, `Fees` |
| Commission | `CommissionALL`, `commissionAll`, `commission`, `Commission` |

## 📊 Interface Utilisateur

### Zone de Sélection
- **Drag & Drop** : Sélection facile des fichiers
- **Validation** : Vérification automatique du format CSV
- **Informations** : Affichage de la taille et du nom du fichier

### Zone de Progression
- **État actuel** : Indication de l'étape en cours
- **Double progression** : Fichiers et lignes séparément
- **Statistiques** : Compteurs en temps réel

### Zone de Résultats
- **Résumé complet** : Statistiques finales
- **Détails** : Répartition des insertions et ignorés
- **Actions** : Possibilité de recommencer ou changer de fichier

## 🚀 Utilisation

1. **Sélectionnez** le type d'import "🧠 Import Intelligent"
2. **Choisissez** votre fichier CSV
3. **Cliquez** sur "Démarrer l'import intelligent"
4. **Observez** la progression en temps réel
5. **Consultez** les résultats finaux

## 🔧 Configuration

### Limites Configurables
```typescript
const MAX_CHUNK_SIZE = 500 * 1024; // Taille maximale par chunk
```

### Personnalisation
- **Taille des chunks** : Modifiable selon les besoins
- **Mapping des colonnes** : Extensible pour de nouveaux formats
- **Seuils de validation** : Paramétrables selon les exigences

## 📈 Métriques de Performance

L'algorithme fournit des métriques détaillées :
- **Vitesse de traitement** : Lignes par seconde
- **Taux de réussite** : Pourcentage de lignes insérées
- **Efficacité** : Rapport insertions/ignorés
- **Temps total** : Durée complète de l'import

## 🎉 Résultat

Un import optimisé, fiable et transparent qui garantit :
- ✅ **Performance maximale** sur tous types de fichiers
- ✅ **Fiabilité absolue** avec gestion d'erreurs robuste
- ✅ **Transparence totale** avec feedback temps réel
- ✅ **Flexibilité** pour s'adapter à différents formats CSV
