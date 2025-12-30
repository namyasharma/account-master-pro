create extension if not exists "vector" with schema "public";


  create table "public"."feature_usage" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "invoice_count" integer default 0,
    "item_count" integer default 0,
    "customer_count" integer default 0,
    "barcode_scan_count" integer default 0,
    "last_reset_date" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
      );


alter table "public"."feature_usage" enable row level security;


  create table "public"."import_subchapter" (
    "subchapter_id" integer,
    "name" text,
    "chapter_id" integer
      );



  create table "public"."payments" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "subscription_id" uuid,
    "razorpay_payment_id" text,
    "razorpay_order_id" text,
    "amount" numeric(10,2),
    "currency" text default 'INR'::text,
    "status" text,
    "payment_date" timestamp with time zone default now()
      );


alter table "public"."payments" enable row level security;


  create table "public"."subscriptions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "plan" text default 'free'::text,
    "status" text default 'trialing'::text,
    "trial_start_date" timestamp with time zone default now(),
    "trial_end_date" timestamp with time zone default (now() + '14 days'::interval),
    "subscription_start_date" timestamp with time zone,
    "subscription_end_date" timestamp with time zone,
    "razorpay_subscription_id" text,
    "razorpay_customer_id" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."subscriptions" enable row level security;

alter table "public"."hsn_code" add column "embedding" public.vector(384);

alter table "public"."items" alter column "gst_rate" set default '0'::numeric;

CREATE UNIQUE INDEX feature_usage_pkey ON public.feature_usage USING btree (id);

CREATE UNIQUE INDEX feature_usage_user_id_key ON public.feature_usage USING btree (user_id);

CREATE INDEX hsn_code_embedding_idx ON public.hsn_code USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');

CREATE INDEX idx_feature_usage_user_id ON public.feature_usage USING btree (user_id);

CREATE INDEX idx_payments_user_id ON public.payments USING btree (user_id);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

CREATE UNIQUE INDEX subscriptions_user_id_key ON public.subscriptions USING btree (user_id);

alter table "public"."feature_usage" add constraint "feature_usage_pkey" PRIMARY KEY using index "feature_usage_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."feature_usage" add constraint "feature_usage_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."feature_usage" validate constraint "feature_usage_user_id_fkey";

alter table "public"."feature_usage" add constraint "feature_usage_user_id_key" UNIQUE using index "feature_usage_user_id_key";

alter table "public"."payments" add constraint "payments_status_check" CHECK ((status = ANY (ARRAY['success'::text, 'failed'::text, 'pending'::text]))) not valid;

alter table "public"."payments" validate constraint "payments_status_check";

alter table "public"."payments" add constraint "payments_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) not valid;

alter table "public"."payments" validate constraint "payments_subscription_id_fkey";

alter table "public"."payments" add constraint "payments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."payments" validate constraint "payments_user_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_plan_check" CHECK ((plan = ANY (ARRAY['free'::text, 'starter'::text, 'professional'::text, 'enterprise'::text]))) not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_plan_check";

alter table "public"."subscriptions" add constraint "subscriptions_status_check" CHECK ((status = ANY (ARRAY['trialing'::text, 'active'::text, 'expired'::text, 'canceled'::text]))) not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_status_check";

alter table "public"."subscriptions" add constraint "subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_user_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_user_id_key" UNIQUE using index "subscriptions_user_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_feature_access(p_user_id uuid, p_feature text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_plan TEXT;
  is_active BOOLEAN;
BEGIN
  SELECT plan, 
         (status = 'active' OR (status = 'trialing' AND trial_end_date > NOW()))
  INTO user_plan, is_active
  FROM subscriptions
  WHERE user_id = p_user_id;
  
  IF NOT is_active THEN
    RETURN FALSE;
  END IF;
  
  -- Feature access matrix
  CASE p_feature
    WHEN 'barcode_scanning' THEN
      RETURN user_plan IN ('starter', 'professional', 'enterprise');
    WHEN 'unlimited_invoices' THEN
      RETURN user_plan IN ('starter', 'professional', 'enterprise');
    WHEN 'advanced_analytics' THEN
      RETURN user_plan IN ('professional', 'enterprise');
    WHEN 'multi_user' THEN
      RETURN user_plan = 'enterprise';
    ELSE
      RETURN TRUE; -- Free features
  END CASE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id uuid, p_usage_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO feature_usage (user_id, invoice_count, item_count, customer_count, barcode_scan_count)
  VALUES (p_user_id, 
          CASE WHEN p_usage_type = 'invoice' THEN 1 ELSE 0 END,
          CASE WHEN p_usage_type = 'item' THEN 1 ELSE 0 END,
          CASE WHEN p_usage_type = 'customer' THEN 1 ELSE 0 END,
          CASE WHEN p_usage_type = 'barcode' THEN 1 ELSE 0 END)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    invoice_count = feature_usage.invoice_count + CASE WHEN p_usage_type = 'invoice' THEN 1 ELSE 0 END,
    item_count = feature_usage.item_count + CASE WHEN p_usage_type = 'item' THEN 1 ELSE 0 END,
    customer_count = feature_usage.customer_count + CASE WHEN p_usage_type = 'customer' THEN 1 ELSE 0 END,
    barcode_scan_count = feature_usage.barcode_scan_count + CASE WHEN p_usage_type = 'barcode' THEN 1 ELSE 0 END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_hsn_semantic(query_vector public.vector, match_count integer DEFAULT 50)
 RETURNS TABLE(id uuid, subchapter_id uuid, hsn_code text, name text, tax_rate numeric, reverse_charge boolean, rate_type text, threshold_amount numeric, rate_below_threshold numeric, rate_above_threshold numeric, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    hsn_code.id,
    hsn_code.subchapter_id,
    hsn_code.hsn_code,
    hsn_code.name,
    hsn_code.tax_rate,
    hsn_code.reverse_charge,
    hsn_code.rate_type,
    hsn_code.threshold_amount,
    hsn_code.rate_below_threshold,
    hsn_code.rate_above_threshold,
    1 - (hsn_code.embedding <=> query_vector) as similarity
  FROM hsn_code
  WHERE hsn_code.embedding IS NOT NULL
  ORDER BY hsn_code.embedding <=> query_vector
  LIMIT match_count;
END;
$function$
;

grant delete on table "public"."feature_usage" to "anon";

grant insert on table "public"."feature_usage" to "anon";

grant references on table "public"."feature_usage" to "anon";

grant select on table "public"."feature_usage" to "anon";

grant trigger on table "public"."feature_usage" to "anon";

grant truncate on table "public"."feature_usage" to "anon";

grant update on table "public"."feature_usage" to "anon";

grant delete on table "public"."feature_usage" to "authenticated";

grant insert on table "public"."feature_usage" to "authenticated";

grant references on table "public"."feature_usage" to "authenticated";

grant select on table "public"."feature_usage" to "authenticated";

grant trigger on table "public"."feature_usage" to "authenticated";

grant truncate on table "public"."feature_usage" to "authenticated";

grant update on table "public"."feature_usage" to "authenticated";

grant delete on table "public"."feature_usage" to "service_role";

grant insert on table "public"."feature_usage" to "service_role";

grant references on table "public"."feature_usage" to "service_role";

grant select on table "public"."feature_usage" to "service_role";

grant trigger on table "public"."feature_usage" to "service_role";

grant truncate on table "public"."feature_usage" to "service_role";

grant update on table "public"."feature_usage" to "service_role";

grant delete on table "public"."import_subchapter" to "anon";

grant insert on table "public"."import_subchapter" to "anon";

grant references on table "public"."import_subchapter" to "anon";

grant select on table "public"."import_subchapter" to "anon";

grant trigger on table "public"."import_subchapter" to "anon";

grant truncate on table "public"."import_subchapter" to "anon";

grant update on table "public"."import_subchapter" to "anon";

grant delete on table "public"."import_subchapter" to "authenticated";

grant insert on table "public"."import_subchapter" to "authenticated";

grant references on table "public"."import_subchapter" to "authenticated";

grant select on table "public"."import_subchapter" to "authenticated";

grant trigger on table "public"."import_subchapter" to "authenticated";

grant truncate on table "public"."import_subchapter" to "authenticated";

grant update on table "public"."import_subchapter" to "authenticated";

grant delete on table "public"."import_subchapter" to "service_role";

grant insert on table "public"."import_subchapter" to "service_role";

grant references on table "public"."import_subchapter" to "service_role";

grant select on table "public"."import_subchapter" to "service_role";

grant trigger on table "public"."import_subchapter" to "service_role";

grant truncate on table "public"."import_subchapter" to "service_role";

grant update on table "public"."import_subchapter" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant references on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant trigger on table "public"."payments" to "anon";

grant truncate on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant references on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant trigger on table "public"."payments" to "service_role";

grant truncate on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";

grant delete on table "public"."subscriptions" to "anon";

grant insert on table "public"."subscriptions" to "anon";

grant references on table "public"."subscriptions" to "anon";

grant select on table "public"."subscriptions" to "anon";

grant trigger on table "public"."subscriptions" to "anon";

grant truncate on table "public"."subscriptions" to "anon";

grant update on table "public"."subscriptions" to "anon";

grant delete on table "public"."subscriptions" to "authenticated";

grant insert on table "public"."subscriptions" to "authenticated";

grant references on table "public"."subscriptions" to "authenticated";

grant select on table "public"."subscriptions" to "authenticated";

grant trigger on table "public"."subscriptions" to "authenticated";

grant truncate on table "public"."subscriptions" to "authenticated";

grant update on table "public"."subscriptions" to "authenticated";

grant delete on table "public"."subscriptions" to "service_role";

grant insert on table "public"."subscriptions" to "service_role";

grant references on table "public"."subscriptions" to "service_role";

grant select on table "public"."subscriptions" to "service_role";

grant trigger on table "public"."subscriptions" to "service_role";

grant truncate on table "public"."subscriptions" to "service_role";

grant update on table "public"."subscriptions" to "service_role";


  create policy "System can manage usage"
  on "public"."feature_usage"
  as permissive
  for all
  to public
using (true);



  create policy "Users can view own usage"
  on "public"."feature_usage"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "System can manage payments"
  on "public"."payments"
  as permissive
  for all
  to public
using (true);



  create policy "Users can view own payments"
  on "public"."payments"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "System can manage subscriptions"
  on "public"."subscriptions"
  as permissive
  for all
  to public
using (true);



  create policy "Users can view own subscription"
  on "public"."subscriptions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



