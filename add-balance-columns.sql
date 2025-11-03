-- Script SQL pour ajouter les colonnes de balance à la table transactions
-- À exécuter directement dans votre base de données Neon PostgreSQL

-- Ajouter les colonnes de balance si elles n'existent pas déjà
ALTER TABLE "transactions" 
ADD COLUMN IF NOT EXISTS "origBalanceBefore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "origBalanceAfter" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "destBalanceBefore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "destBalanceAfter" DOUBLE PRECISION;

-- Vérification : Afficher les colonnes ajoutées
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name IN ('origBalanceBefore', 'origBalanceAfter', 'destBalanceBefore', 'destBalanceAfter');

