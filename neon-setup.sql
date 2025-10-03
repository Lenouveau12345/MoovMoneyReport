-- =====================================================
-- 🚀 SCRIPT DE CONFIGURATION NEON POUR MOOV MONEY REPORT
-- =====================================================
-- Ce script crée toutes les tables nécessaires et insère l'utilisateur admin par défaut
-- Exécutez ce script dans votre dashboard Neon (SQL Editor)

-- =====================================================
-- 1. CRÉATION DES ENUMS
-- =====================================================

-- Créer l'enum pour les rôles utilisateur
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Créer l'enum pour le statut d'import
DO $$ BEGIN
    CREATE TYPE "ImportStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. CRÉATION DES TABLES
-- =====================================================

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Table des sessions d'import
CREATE TABLE IF NOT EXISTS "import_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "validRows" INTEGER NOT NULL,
    "importedRows" INTEGER NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Table des transactions
CREATE TABLE IF NOT EXISTS "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "transactionInitiatedTime" TIMESTAMP(3) NOT NULL,
    "frmsisdn" TEXT NOT NULL,
    "tomsisdn" TEXT NOT NULL,
    "frName" TEXT,
    "toName" TEXT,
    "frProfile" TEXT NOT NULL,
    "toProfile" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "commissionAll" DOUBLE PRECISION NOT NULL,
    "merchantsOnlineCashIn" TEXT NOT NULL,
    "importSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commissionDistributeur" DOUBLE PRECISION,
    "commissionMarchand" DOUBLE PRECISION,
    "commissionRevendeur" DOUBLE PRECISION,
    "commissionSousDistributeur" DOUBLE PRECISION,
    
    -- Clé étrangère vers import_sessions
    CONSTRAINT "transactions_importSessionId_fkey" 
        FOREIGN KEY ("importSessionId") 
        REFERENCES "import_sessions"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- =====================================================
-- 3. CRÉATION DES INDEX
-- =====================================================

-- Index unique pour l'email des utilisateurs
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- Index unique pour transactionId + importSessionId
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_transactionId_importSessionId_key" 
    ON "transactions"("transactionId", "importSessionId");

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "transactions_importSessionId_idx" ON "transactions"("importSessionId");
CREATE INDEX IF NOT EXISTS "transactions_transactionInitiatedTime_idx" ON "transactions"("transactionInitiatedTime");
CREATE INDEX IF NOT EXISTS "transactions_frmsisdn_idx" ON "transactions"("frmsisdn");
CREATE INDEX IF NOT EXISTS "transactions_tomsisdn_idx" ON "transactions"("tomsisdn");

-- =====================================================
-- 4. INSERTION DE L'UTILISATEUR ADMIN PAR DÉFAUT
-- =====================================================

-- Fonction pour générer un CUID (simulation simple)
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS $$
BEGIN
    RETURN 'c' || substr(md5(random()::text), 1, 24);
END;
$$ LANGUAGE plpgsql;

-- Insérer l'utilisateur admin par défaut
-- Le mot de passe 'admin123' est hashé avec bcrypt (salt rounds: 12)
-- Hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K
INSERT INTO "users" (
    "id",
    "email", 
    "password", 
    "name", 
    "role", 
    "createdAt", 
    "updatedAt"
) VALUES (
    generate_cuid(),
    'admin@moovmoney.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', -- admin123
    'Administrateur',
    'ADMIN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("email") DO UPDATE SET
    "password" = EXCLUDED."password",
    "name" = EXCLUDED."name",
    "role" = EXCLUDED."role",
    "updatedAt" = CURRENT_TIMESTAMP;

-- =====================================================
-- 5. VÉRIFICATION
-- =====================================================

-- Afficher les tables créées
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'transactions', 'import_sessions')
ORDER BY tablename;

-- Afficher l'utilisateur créé
SELECT 
    id,
    email,
    name,
    role,
    "createdAt"
FROM "users" 
WHERE email = 'admin@moovmoney.com';

-- =====================================================
-- ✅ SCRIPT TERMINÉ
-- =====================================================
-- 
-- 🎉 Configuration terminée avec succès !
-- 
-- 📋 Informations de connexion :
-- 👑 Admin:
--    Email: admin@moovmoney.com
--    Mot de passe: admin123
--    Rôle: ADMIN
-- 
-- 🗄️ Tables créées :
--    ✅ users (utilisateurs)
--    ✅ transactions (transactions)
--    ✅ import_sessions (sessions d'import)
-- 
-- 🔗 Relations configurées :
--    ✅ transactions → import_sessions (clé étrangère)
-- 
-- 📊 Index créés pour optimiser les performances
-- 
-- =====================================================
