-- Migration to add balance columns to transactions table
-- Generated manually

ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "origBalanceBefore" DOUBLE PRECISION;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "origBalanceAfter" DOUBLE PRECISION;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "destBalanceBefore" DOUBLE PRECISION;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "destBalanceAfter" DOUBLE PRECISION;


