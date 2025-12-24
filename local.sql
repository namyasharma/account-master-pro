-- Basic settings
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Enums
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE "public"."app_role" AS ENUM ('admin', 'user');
    END IF;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "public"."businesses" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "owner_id" uuid NOT NULL,
    "address" text,
    "email" text,
    "gstin" text,
    "phone" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Primary key if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'businesses_pkey'
    ) THEN
        ALTER TABLE "public"."businesses" ADD CONSTRAINT "businesses_pkey" PRIMARY KEY ("id");
    END IF;
END $$;

-- Example for a foreign key if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'businesses'
          AND kcu.column_name = 'owner_id'
    ) THEN
        ALTER TABLE "public"."businesses"
        ADD CONSTRAINT "businesses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id");
    END IF;
END $$;

-- Repeat similar blocks for other tables: chapter, customers, hsn_code, invoice_line_items, invoices, items, profiles, purchase_entries, state_code, subchapter, suppliers, tax_period_summaries, temp_hsn, user_roles

-- Note: skip ALTER TABLE OWNER commands if role "supabase_admin" does not exist remotely
-- GRANTS can stay if you want permissions set
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
