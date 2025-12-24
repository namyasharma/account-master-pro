


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


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'user'
);


-- ALTER TYPE "public"."app_role" OWNER TO "supabase_admin";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."businesses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "address" "text",
    "email" "text",
    "gstin" "text",
    "phone" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


-- ALTER TABLE "public"."businesses" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."chapter" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "chapter_id" integer NOT NULL,
    "name" "text" NOT NULL
);


-- ALTER TABLE "public"."chapter" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "email" "text",
    "gstin" "text",
    "phone" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


-- ALTER TABLE "public"."customers" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."hsn_code" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "subchapter_id" "uuid" NOT NULL,
    "hsn_code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "tax_rate" numeric NOT NULL,
    "subchapter_id_int" bigint,
    "reverse_charge" boolean DEFAULT false NOT NULL,
    "rate_type" "text" DEFAULT 'flat'::"text" NOT NULL,
    "threshold_amount" numeric,
    "rate_below_threshold" numeric,
    "rate_above_threshold" numeric
);


-- ALTER TABLE "public"."hsn_code" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."invoice_line_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "item_id" "uuid",
    "description" "text" NOT NULL,
    "quantity" numeric DEFAULT 1 NOT NULL,
    "unit_price" numeric NOT NULL,
    "line_total" numeric DEFAULT 0 NOT NULL,
    "gst_rate" numeric DEFAULT 0 NOT NULL,
    "gst_amount" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


-- ALTER TABLE "public"."invoice_line_items" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "invoice_number" "text" NOT NULL,
    "invoice_date" "date" NOT NULL,
    "buyer_name" "text" NOT NULL,
    "buyer_gstin" "text",
    "subtotal" numeric DEFAULT 0 NOT NULL,
    "gst_amount" numeric DEFAULT 0 NOT NULL,
    "total" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


-- ALTER TABLE "public"."invoices" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "unit_of_measure" "text" NOT NULL,
    "unit_price" numeric NOT NULL,
    "category_code" "text",
    "gst_bracket_source" "text",
    "gst_rate" numeric NOT NULL,
    "hsn_sac_code" "text",
    "sku" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


-- ALTER TABLE "public"."items" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "onboarding_completed" boolean,
    "theme" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


-- ALTER TABLE "public"."profiles" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."purchase_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "supplier_id" "uuid",
    "supplier_name" "text" NOT NULL,
    "supplier_gstin" "text",
    "entry_number" "text" NOT NULL,
    "entry_date" "date" NOT NULL,
    "subtotal" numeric DEFAULT 0 NOT NULL,
    "gst_amount" numeric DEFAULT 0 NOT NULL,
    "total" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


-- ALTER TABLE "public"."purchase_entries" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."state_code" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL
);


-- ALTER TABLE "public"."state_code" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."subchapter" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "subchapter_id" integer NOT NULL,
    "name" "text" NOT NULL,
    "chapter_id" "uuid" NOT NULL,
    "chapter_id_int" integer
);


-- ALTER TABLE "public"."subchapter" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "email" "text",
    "gstin" "text",
    "phone" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


-- ALTER TABLE "public"."suppliers" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."tax_period_summaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "total_sales" numeric DEFAULT 0 NOT NULL,
    "total_purchases" numeric DEFAULT 0 NOT NULL,
    "output_gst" numeric DEFAULT 0 NOT NULL,
    "input_gst" numeric DEFAULT 0 NOT NULL,
    "net_gst" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


-- ALTER TABLE "public"."tax_period_summaries" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."temp_hsn" (
    "subchapter_id" bigint NOT NULL,
    "hsn_code" bigint NOT NULL,
    "name" "text",
    "tax_rate" numeric,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reverse_charge" boolean DEFAULT true,
    "rate_type" "text" DEFAULT 'flat'::"text" NOT NULL,
    "threshold_amount" numeric,
    "rate_below_threshold" numeric,
    "rate_above_threshold" numeric
);


-- ALTER TABLE "public"."temp_hsn" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" DEFAULT 'user'::"public"."app_role" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


-- ALTER TABLE "public"."user_roles" OWNER TO "supabase_admin";


ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chapter"
    ADD CONSTRAINT "chapter_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hsn_code"
    ADD CONSTRAINT "hsn_code_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_line_items"
    ADD CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_entries"
    ADD CONSTRAINT "purchase_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."state_code"
    ADD CONSTRAINT "state_code_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subchapter"
    ADD CONSTRAINT "subchapter_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_period_summaries"
    ADD CONSTRAINT "tax_period_summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."temp_hsn"
    ADD CONSTRAINT "temp_hsn_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id");



ALTER TABLE ONLY "public"."hsn_code"
    ADD CONSTRAINT "hsn_code_subchapter_id_fkey" FOREIGN KEY ("subchapter_id") REFERENCES "public"."subchapter"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_line_items"
    ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id");



ALTER TABLE ONLY "public"."invoice_line_items"
    ADD CONSTRAINT "invoice_line_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id");



ALTER TABLE ONLY "public"."purchase_entries"
    ADD CONSTRAINT "purchase_entries_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id");



ALTER TABLE ONLY "public"."purchase_entries"
    ADD CONSTRAINT "purchase_entries_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."subchapter"
    ADD CONSTRAINT "subchapter_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapter"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id");



ALTER TABLE ONLY "public"."tax_period_summaries"
    ADD CONSTRAINT "tax_period_summaries_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id");





-- ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON TABLE "public"."businesses" TO "postgres";
GRANT ALL ON TABLE "public"."businesses" TO "anon";
GRANT ALL ON TABLE "public"."businesses" TO "authenticated";
GRANT ALL ON TABLE "public"."businesses" TO "service_role";



GRANT ALL ON TABLE "public"."chapter" TO "postgres";
GRANT ALL ON TABLE "public"."chapter" TO "anon";
GRANT ALL ON TABLE "public"."chapter" TO "authenticated";
GRANT ALL ON TABLE "public"."chapter" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "postgres";
GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."hsn_code" TO "postgres";
GRANT ALL ON TABLE "public"."hsn_code" TO "anon";
GRANT ALL ON TABLE "public"."hsn_code" TO "authenticated";
GRANT ALL ON TABLE "public"."hsn_code" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_line_items" TO "postgres";
GRANT ALL ON TABLE "public"."invoice_line_items" TO "anon";
GRANT ALL ON TABLE "public"."invoice_line_items" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_line_items" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "postgres";
GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "postgres";
GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "postgres";
GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_entries" TO "postgres";
GRANT ALL ON TABLE "public"."purchase_entries" TO "anon";
GRANT ALL ON TABLE "public"."purchase_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_entries" TO "service_role";



GRANT ALL ON TABLE "public"."state_code" TO "postgres";
GRANT ALL ON TABLE "public"."state_code" TO "anon";
GRANT ALL ON TABLE "public"."state_code" TO "authenticated";
GRANT ALL ON TABLE "public"."state_code" TO "service_role";



GRANT ALL ON TABLE "public"."subchapter" TO "postgres";
GRANT ALL ON TABLE "public"."subchapter" TO "anon";
GRANT ALL ON TABLE "public"."subchapter" TO "authenticated";
GRANT ALL ON TABLE "public"."subchapter" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "postgres";
GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."tax_period_summaries" TO "postgres";
GRANT ALL ON TABLE "public"."tax_period_summaries" TO "anon";
GRANT ALL ON TABLE "public"."tax_period_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_period_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."temp_hsn" TO "postgres";
GRANT ALL ON TABLE "public"."temp_hsn" TO "anon";
GRANT ALL ON TABLE "public"."temp_hsn" TO "authenticated";
GRANT ALL ON TABLE "public"."temp_hsn" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "postgres";
GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































