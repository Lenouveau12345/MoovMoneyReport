-- =====================================================
-- 🔧 CORRECTION DE LA CONTRAINTE D'UNICITÉ
-- =====================================================
-- Ce script modifie la contrainte d'unicité pour que transactionId soit unique globalement
-- Exécutez ce script dans votre dashboard Neon (SQL Editor)

-- =====================================================
-- 1. SUPPRIMER L'ANCIENNE CONTRAINTE
-- =====================================================

-- Supprimer l'ancienne contrainte d'unicité composite
ALTER TABLE "transactions" 
DROP CONSTRAINT IF EXISTS "transactions_transactionId_importSessionId_key";

-- =====================================================
-- 2. NETTOYER LES DOUBLONS EXISTANTS
-- =====================================================

-- Supprimer les doublons en gardant la première occurrence de chaque transactionId
DELETE FROM "transactions" 
WHERE "id" NOT IN (
  SELECT MIN("id") 
  FROM "transactions" 
  GROUP BY "transactionId"
);

-- =====================================================
-- 3. CRÉER LA NOUVELLE CONTRAINTE D'UNICITÉ
-- =====================================================

-- Créer la nouvelle contrainte d'unicité globale sur transactionId
ALTER TABLE "transactions" 
ADD CONSTRAINT "transactions_transactionId_key" 
UNIQUE ("transactionId");

-- =====================================================
-- 4. VÉRIFICATION
-- =====================================================

-- Vérifier qu'il n'y a plus de doublons
SELECT 
  "transactionId", 
  COUNT(*) as count
FROM "transactions"
GROUP BY "transactionId"
HAVING COUNT(*) > 1;

-- Afficher les contraintes d'unicité
SELECT 
  constraint_name, 
  constraint_type,
  column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'transactions' 
  AND tc.constraint_type = 'UNIQUE';

-- Statistiques finales
SELECT 
  COUNT(*) as total_transactions,
  COUNT(DISTINCT "transactionId") as unique_transaction_ids
FROM "transactions";

-- =====================================================
-- ✅ SCRIPT TERMINÉ
-- =====================================================
-- 
-- 🎉 Correction terminée avec succès !
-- 
-- 📋 Résumé des modifications:
--    ✅ Ancienne contrainte supprimée: transactionId + importSessionId
--    ✅ Doublons nettoyés (première occurrence conservée)
--    ✅ Nouvelle contrainte créée: transactionId unique globalement
--    ✅ Vérifications effectuées
-- 
-- 🔒 Résultat:
--    - Chaque transactionId ne peut exister qu'une seule fois dans la base
--    - Les futurs imports ne créeront plus de doublons
--    - L'intégrité des données est préservée
-- 
-- =====================================================
