# Migration : Ajout des colonnes de balance

## Problème

Les endpoints API retournent des erreurs 500 car les colonnes de balance n'existent pas encore dans la base de données.

## Solution

Les endpoints ont été modifiés pour fonctionner avec ou sans les colonnes de balance. Cependant, pour utiliser pleinement les fonctionnalités de balance, vous devez ajouter les colonnes à votre base de données.

## Étape 1 : Ajouter les colonnes à la base de données

Exécutez le script SQL suivant dans votre base de données Neon PostgreSQL :

```sql
-- Ajouter les colonnes de balance si elles n'existent pas déjà
ALTER TABLE "transactions" 
ADD COLUMN IF NOT EXISTS "origBalanceBefore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "origBalanceAfter" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "destBalanceBefore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "destBalanceAfter" DOUBLE PRECISION;
```

### Comment exécuter dans Neon :

1. Connectez-vous à votre projet Neon sur https://console.neon.tech
2. Allez dans l'onglet "SQL Editor"
3. Collez le script SQL ci-dessus
4. Cliquez sur "Run"

Ou utilisez le fichier `add-balance-columns.sql` fourni.

## Étape 2 : Vérification

Après avoir ajouté les colonnes, les endpoints suivants fonctionneront avec les données de balance :

- `/api/transactions` - Inclura les colonnes de balance dans les résultats
- `/api/balances-by-date` - Utilisera les soldes pour la consultation des soldes par date
- Les pages de consultation afficheront les soldes correctement

## Étape 3 : Réimporter les données (optionnel)

Si vous avez des fichiers CSV avec les colonnes `ORIGBALANCEBEFORE`, `ORIGBALANCEAFTER`, `DESTBALANCEBEFORE`, `DESTBALANCEAFTER`, réimportez-les pour remplir ces colonnes avec les valeurs.

## Notes

- Les endpoints fonctionnent maintenant même sans les colonnes (elles retourneront `null`)
- Une fois les colonnes ajoutées, les nouvelles importations incluront automatiquement les données de balance
- Les anciennes transactions auront `null` pour les colonnes de balance jusqu'à réimport


