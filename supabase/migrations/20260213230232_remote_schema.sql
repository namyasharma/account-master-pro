create type "public"."authority_type" as enum ('CBIC', 'GST_COUNCIL', 'STATE');

create type "public"."code_type" as enum ('HSN', 'SAC');

create type "public"."industry_type" as enum ('general', 'retail', 'restaurant',  'services');

create type "public"."notification_status" as enum ('pending', 'parsed', 'failed', 'superseded');


  create table "public"."gst_notification" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "notification_number" text not null,
    "authority" public.authority_type not null default 'CBIC'::public.authority_type,
    "issued_at" date not null,
    "effective_from" date not null,
    "effective_to" date,
    "source_url" text,
    "document_hash" text,
    "summary" text,
    "supersedes_notification_id" uuid,
    "status" public.notification_status default 'pending'::public.notification_status,
    "parse_error" text,
    "parsed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."gst_rate_override" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "applies_to_type" public.code_type not null,
    "hsn_start" text,
    "hsn_end" text,
    "sac_code" text,
    "exclusion_codes" text[],
    "cgst_rate" numeric(5,2),
    "sgst_rate" numeric(5,2),
    "igst_rate" numeric(5,2),
    "cess_rate" numeric(5,2),
    "is_exempt" boolean default false,
    "condition_text" text,
    "effective_from" date not null,
    "effective_to" date,
    "reason" text not null,
    "created_by" uuid,
    "approved_by" uuid,
    "priority" integer default 100,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."gst_rate_rule" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "notification_id" uuid not null,
    "applies_to_type" public.code_type not null,
    "hsn_start" text,
    "hsn_end" text,
    "sac_code" text,
    "exclusion_codes" text[],
    "cgst_rate" numeric(5,2),
    "sgst_rate" numeric(5,2),
    "igst_rate" numeric(5,2),
    "cess_rate" numeric(5,2),
    "is_exempt" boolean default false,
    "condition_text" text,
    "effective_from" date not null,
    "effective_to" date,
    "raw_row_json" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."hsn_sac" (
    "id" uuid,
    "code" text,
    "description" text,
    "type" public.code_type,
    "code_length" integer,
    "is_active" boolean,
    "parent_code" text,
    "introduced_on" date,
    "deprecated_on" date,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
      );



  create table "public"."hsn_sac_old" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "code" text not null,
    "type" public.code_type not null,
    "description" text not null,
    "code_length" integer not null,
    "is_active" boolean default true,
    "introduced_on" date,
    "deprecated_on" date,
    "parent_code" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."industry_templates" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "industry" character varying(50) not null,
    "template_config" jsonb not null,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."parser_audit_log" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "notification_id" uuid,
    "started_at" timestamp with time zone not null default now(),
    "completed_at" timestamp with time zone,
    "status" text not null,
    "rows_parsed" integer,
    "rows_inserted" integer,
    "rows_failed" integer,
    "error_details" jsonb,
    "validation_checks" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."businesses" add column "industry" public.industry_type default 'general'::public.industry_type;

alter table "public"."businesses" add column "state_code" character varying(2);

alter table "public"."customers" enable row level security;

alter table "public"."invoice_line_items" add column "hsn_sac_code" character varying(8);

alter table "public"."invoices" add column "cgst_amount" numeric(10,2) not null default 0;

alter table "public"."invoices" add column "igst_amount" numeric(10,2) not null default 0;

alter table "public"."invoices" add column "place_of_supply" character varying(2);

alter table "public"."invoices" add column "sgst_amount" numeric(10,2) not null default 0;

alter table "public"."purchase_entries" enable row level security;

alter table "public"."state_code" add column "gst_code" character varying(2);

alter table "public"."suppliers" enable row level security;

alter table "public"."tax_period_summaries" enable row level security;

alter table "public"."user_roles" enable row level security;

CREATE UNIQUE INDEX gst_notification_document_hash_key ON public.gst_notification USING btree (document_hash);

CREATE UNIQUE INDEX gst_notification_notification_number_key ON public.gst_notification USING btree (notification_number);

CREATE UNIQUE INDEX gst_notification_pkey ON public.gst_notification USING btree (id);

CREATE UNIQUE INDEX gst_rate_override_pkey ON public.gst_rate_override USING btree (id);

CREATE UNIQUE INDEX gst_rate_rule_pkey ON public.gst_rate_rule USING btree (id);

CREATE UNIQUE INDEX hsn_sac_code_key ON public.hsn_sac_old USING btree (code);

CREATE UNIQUE INDEX hsn_sac_pkey ON public.hsn_sac_old USING btree (id);

CREATE INDEX idx_audit_notification ON public.parser_audit_log USING btree (notification_id);

CREATE INDEX idx_audit_status ON public.parser_audit_log USING btree (status);

CREATE INDEX idx_hsn_sac_active ON public.hsn_sac_old USING btree (is_active);

CREATE INDEX idx_hsn_sac_code ON public.hsn_sac_old USING btree (code);

CREATE INDEX idx_hsn_sac_description ON public.hsn_sac_old USING gin (to_tsvector('english'::regconfig, description));

CREATE INDEX idx_hsn_sac_type ON public.hsn_sac_old USING btree (type);

CREATE INDEX idx_invoices_business_id ON public.invoices USING btree (business_id);

CREATE INDEX idx_invoices_place_of_supply ON public.invoices USING btree (place_of_supply);

CREATE INDEX idx_notification_effective ON public.gst_notification USING btree (effective_from, effective_to);

CREATE INDEX idx_notification_hash ON public.gst_notification USING btree (document_hash);

CREATE INDEX idx_notification_number ON public.gst_notification USING btree (notification_number);

CREATE INDEX idx_notification_status ON public.gst_notification USING btree (status);

CREATE INDEX idx_override_effective ON public.gst_rate_override USING btree (effective_from, effective_to);

CREATE INDEX idx_override_priority ON public.gst_rate_override USING btree (priority);

CREATE INDEX idx_rate_rule_effective ON public.gst_rate_rule USING btree (effective_from, effective_to);

CREATE INDEX idx_rate_rule_hsn_range ON public.gst_rate_rule USING btree (hsn_start, hsn_end);

CREATE INDEX idx_rate_rule_notification ON public.gst_rate_rule USING btree (notification_id);

CREATE INDEX idx_rate_rule_sac ON public.gst_rate_rule USING btree (sac_code);

CREATE UNIQUE INDEX industry_templates_industry_key ON public.industry_templates USING btree (industry);

CREATE UNIQUE INDEX industry_templates_pkey ON public.industry_templates USING btree (id);

CREATE UNIQUE INDEX parser_audit_log_pkey ON public.parser_audit_log USING btree (id);

CREATE UNIQUE INDEX uniq_gst_rule_identity ON public.gst_rate_rule USING btree (notification_id, applies_to_type, hsn_start, hsn_end, sac_code);

alter table "public"."gst_notification" add constraint "gst_notification_pkey" PRIMARY KEY using index "gst_notification_pkey";

alter table "public"."gst_rate_override" add constraint "gst_rate_override_pkey" PRIMARY KEY using index "gst_rate_override_pkey";

alter table "public"."gst_rate_rule" add constraint "gst_rate_rule_pkey" PRIMARY KEY using index "gst_rate_rule_pkey";

alter table "public"."hsn_sac_old" add constraint "hsn_sac_pkey" PRIMARY KEY using index "hsn_sac_pkey";

alter table "public"."industry_templates" add constraint "industry_templates_pkey" PRIMARY KEY using index "industry_templates_pkey";

alter table "public"."parser_audit_log" add constraint "parser_audit_log_pkey" PRIMARY KEY using index "parser_audit_log_pkey";

alter table "public"."gst_notification" add constraint "gst_notification_document_hash_key" UNIQUE using index "gst_notification_document_hash_key";

alter table "public"."gst_notification" add constraint "gst_notification_notification_number_key" UNIQUE using index "gst_notification_notification_number_key";

alter table "public"."gst_notification" add constraint "gst_notification_supersedes_notification_id_fkey" FOREIGN KEY (supersedes_notification_id) REFERENCES public.gst_notification(id) not valid;

alter table "public"."gst_notification" validate constraint "gst_notification_supersedes_notification_id_fkey";

alter table "public"."gst_rate_rule" add constraint "gst_rate_rule_check" CHECK ((((applies_to_type = 'HSN'::public.code_type) AND (hsn_start IS NOT NULL)) OR ((applies_to_type = 'SAC'::public.code_type) AND (sac_code IS NOT NULL)))) not valid;

alter table "public"."gst_rate_rule" validate constraint "gst_rate_rule_check";

alter table "public"."gst_rate_rule" add constraint "gst_rate_rule_check1" CHECK (((igst_rate IS NULL) OR ((cgst_rate + sgst_rate) = igst_rate))) not valid;

alter table "public"."gst_rate_rule" validate constraint "gst_rate_rule_check1";

alter table "public"."gst_rate_rule" add constraint "gst_rate_rule_notification_id_fkey" FOREIGN KEY (notification_id) REFERENCES public.gst_notification(id) ON DELETE RESTRICT not valid;

alter table "public"."gst_rate_rule" validate constraint "gst_rate_rule_notification_id_fkey";

alter table "public"."hsn_sac_old" add constraint "hsn_sac_code_key" UNIQUE using index "hsn_sac_code_key";

alter table "public"."hsn_sac_old" add constraint "hsn_sac_code_length_check" CHECK (((code_length >= 1) AND (code_length <= 8))) not valid;

alter table "public"."hsn_sac_old" validate constraint "hsn_sac_code_length_check";

alter table "public"."industry_templates" add constraint "industry_templates_industry_key" UNIQUE using index "industry_templates_industry_key";

alter table "public"."parser_audit_log" add constraint "parser_audit_log_notification_id_fkey" FOREIGN KEY (notification_id) REFERENCES public.gst_notification(id) not valid;

alter table "public"."parser_audit_log" validate constraint "parser_audit_log_notification_id_fkey";

set check_function_bodies = off;

create or replace view "public"."current_gst_rates" as  WITH ranked_rules AS (
         SELECT 'rule'::text AS source_type,
            r.id,
            r.applies_to_type,
            r.hsn_start,
            r.hsn_end,
            r.sac_code,
            r.exclusion_codes,
            r.cgst_rate,
            r.sgst_rate,
            r.igst_rate,
            r.cess_rate,
            r.is_exempt,
            r.condition_text,
            r.effective_from,
            r.effective_to,
            0 AS priority,
            r.notification_id
           FROM public.gst_rate_rule r
          WHERE ((r.effective_from <= CURRENT_DATE) AND ((r.effective_to IS NULL) OR (r.effective_to > CURRENT_DATE)))
        UNION ALL
         SELECT 'override'::text AS source_type,
            o.id,
            o.applies_to_type,
            o.hsn_start,
            o.hsn_end,
            o.sac_code,
            o.exclusion_codes,
            o.cgst_rate,
            o.sgst_rate,
            o.igst_rate,
            o.cess_rate,
            o.is_exempt,
            o.condition_text,
            o.effective_from,
            o.effective_to,
            o.priority,
            NULL::uuid AS notification_id
           FROM public.gst_rate_override o
          WHERE ((o.effective_from <= CURRENT_DATE) AND ((o.effective_to IS NULL) OR (o.effective_to > CURRENT_DATE)))
        )
 SELECT source_type,
    id,
    applies_to_type,
    hsn_start,
    hsn_end,
    sac_code,
    exclusion_codes,
    cgst_rate,
    sgst_rate,
    igst_rate,
    cess_rate,
    is_exempt,
    condition_text,
    effective_from,
    effective_to,
    priority,
    notification_id
   FROM ranked_rules
  ORDER BY priority DESC, effective_from DESC;


CREATE OR REPLACE FUNCTION public.get_current_gst_rate(p_hsn_sac_code text, p_transaction_date date)
 RETURNS TABLE(cgst_rate numeric, sgst_rate numeric, igst_rate numeric, cess_rate numeric, is_exempt boolean, source text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- First, check overrides (highest priority)
    RETURN QUERY
    SELECT
        o.cgst_rate,
        o.sgst_rate,
        o.igst_rate,
        o.cess_rate,
        o.is_exempt,
        'override'::text AS source
    FROM gst_rate_override o
    WHERE (o.hsn_start IS NULL OR o.hsn_start <= p_hsn_sac_code)
      AND (o.hsn_end IS NULL OR o.hsn_end >= p_hsn_sac_code)
      AND (o.sac_code IS NULL OR o.sac_code = p_hsn_sac_code)
      AND o.effective_from <= p_transaction_date
      AND (o.effective_to IS NULL OR o.effective_to >= p_transaction_date)
    ORDER BY o.priority ASC
    LIMIT 1;

    -- If no override found, check rules
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT
            r.cgst_rate,
            r.sgst_rate,
            r.igst_rate,
            r.cess_rate,
            r.is_exempt,
            'rule'::text AS source
        FROM gst_rate_rule r
        WHERE (r.hsn_start IS NULL OR r.hsn_start <= LEFT(p_hsn_sac_code,4))
          AND (r.hsn_end IS NULL OR r.hsn_end >= LEFT(p_hsn_sac_code,4))
          AND (r.sac_code IS NULL OR r.sac_code = p_hsn_sac_code)
          AND r.effective_from <= p_transaction_date
          AND (r.effective_to IS NULL OR r.effective_to >= p_transaction_date)
        ORDER BY r.effective_from DESC
        LIMIT 1;
    END IF;

    -- If no override or rule, return nulls (frontend can fallback to default)
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, false::boolean, 'none'::text;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_gst_rate(p_code text, p_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(code text, cgst_rate numeric, sgst_rate numeric, igst_rate numeric, cess_rate numeric, is_exempt boolean, condition_text text, source_type text, effective_from date, notification_number text)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  WITH matched_rules AS (
    SELECT 
      r.*,
      n.notification_number,
      CASE 
        WHEN r.sac_code = p_code THEN 1000
        WHEN r.hsn_start = p_code AND r.hsn_end = p_code THEN 1000
        WHEN p_code BETWEEN r.hsn_start AND r.hsn_end 
             AND NOT (p_code = ANY(COALESCE(r.exclusion_codes, ARRAY[]::TEXT[])))
          THEN 100 / (COALESCE(LENGTH(r.hsn_end) - LENGTH(r.hsn_start), 1))
        ELSE 0
      END as specificity
    FROM current_gst_rates r
    LEFT JOIN gst_notification n ON r.notification_id = n.id
    WHERE r.effective_from <= p_date 
      AND (r.effective_to IS NULL OR r.effective_to > p_date)
      AND (
        (r.applies_to_type = 'SAC' AND r.sac_code = p_code) OR
        (r.applies_to_type = 'HSN' AND p_code BETWEEN r.hsn_start AND r.hsn_end
         AND NOT (p_code = ANY(COALESCE(r.exclusion_codes, ARRAY[]::TEXT[]))))
      )
  )
  SELECT 
    p_code as code,
    mr.cgst_rate,
    mr.sgst_rate,
    mr.igst_rate,
    mr.cess_rate,
    mr.is_exempt,
    mr.condition_text,
    mr.source_type,
    mr.effective_from,
    mr.notification_number
  FROM matched_rules mr
  ORDER BY mr.priority DESC, mr.specificity DESC, mr.effective_from DESC
  LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_hsn_sac_codes(search_query text, limit_count integer DEFAULT 50)
 RETURNS TABLE(id uuid, code text, type public.code_type, description text)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    h.id,
    h.code,
    h.type,
    h.description
  FROM public.hsn_sac h
  WHERE
    h.is_active = true
    AND (
      h.code ILIKE search_query || '%'
      OR h.description ILIKE '%' || search_query || '%'
    )
  ORDER BY
    CASE
      WHEN h.code ILIKE search_query || '%' THEN 0
      ELSE 1
    END,
    length(h.code),
    h.code
  LIMIT limit_count;
$function$
;

grant delete on table "public"."gst_notification" to "anon";

grant insert on table "public"."gst_notification" to "anon";

grant references on table "public"."gst_notification" to "anon";

grant select on table "public"."gst_notification" to "anon";

grant trigger on table "public"."gst_notification" to "anon";

grant truncate on table "public"."gst_notification" to "anon";

grant update on table "public"."gst_notification" to "anon";

grant delete on table "public"."gst_notification" to "authenticated";

grant insert on table "public"."gst_notification" to "authenticated";

grant references on table "public"."gst_notification" to "authenticated";

grant select on table "public"."gst_notification" to "authenticated";

grant trigger on table "public"."gst_notification" to "authenticated";

grant truncate on table "public"."gst_notification" to "authenticated";

grant update on table "public"."gst_notification" to "authenticated";

grant delete on table "public"."gst_notification" to "service_role";

grant insert on table "public"."gst_notification" to "service_role";

grant references on table "public"."gst_notification" to "service_role";

grant select on table "public"."gst_notification" to "service_role";

grant trigger on table "public"."gst_notification" to "service_role";

grant truncate on table "public"."gst_notification" to "service_role";

grant update on table "public"."gst_notification" to "service_role";

grant delete on table "public"."gst_rate_override" to "anon";

grant insert on table "public"."gst_rate_override" to "anon";

grant references on table "public"."gst_rate_override" to "anon";

grant select on table "public"."gst_rate_override" to "anon";

grant trigger on table "public"."gst_rate_override" to "anon";

grant truncate on table "public"."gst_rate_override" to "anon";

grant update on table "public"."gst_rate_override" to "anon";

grant delete on table "public"."gst_rate_override" to "authenticated";

grant insert on table "public"."gst_rate_override" to "authenticated";

grant references on table "public"."gst_rate_override" to "authenticated";

grant select on table "public"."gst_rate_override" to "authenticated";

grant trigger on table "public"."gst_rate_override" to "authenticated";

grant truncate on table "public"."gst_rate_override" to "authenticated";

grant update on table "public"."gst_rate_override" to "authenticated";

grant delete on table "public"."gst_rate_override" to "service_role";

grant insert on table "public"."gst_rate_override" to "service_role";

grant references on table "public"."gst_rate_override" to "service_role";

grant select on table "public"."gst_rate_override" to "service_role";

grant trigger on table "public"."gst_rate_override" to "service_role";

grant truncate on table "public"."gst_rate_override" to "service_role";

grant update on table "public"."gst_rate_override" to "service_role";

grant delete on table "public"."gst_rate_rule" to "anon";

grant insert on table "public"."gst_rate_rule" to "anon";

grant references on table "public"."gst_rate_rule" to "anon";

grant select on table "public"."gst_rate_rule" to "anon";

grant trigger on table "public"."gst_rate_rule" to "anon";

grant truncate on table "public"."gst_rate_rule" to "anon";

grant update on table "public"."gst_rate_rule" to "anon";

grant delete on table "public"."gst_rate_rule" to "authenticated";

grant insert on table "public"."gst_rate_rule" to "authenticated";

grant references on table "public"."gst_rate_rule" to "authenticated";

grant select on table "public"."gst_rate_rule" to "authenticated";

grant trigger on table "public"."gst_rate_rule" to "authenticated";

grant truncate on table "public"."gst_rate_rule" to "authenticated";

grant update on table "public"."gst_rate_rule" to "authenticated";

grant delete on table "public"."gst_rate_rule" to "service_role";

grant insert on table "public"."gst_rate_rule" to "service_role";

grant references on table "public"."gst_rate_rule" to "service_role";

grant select on table "public"."gst_rate_rule" to "service_role";

grant trigger on table "public"."gst_rate_rule" to "service_role";

grant truncate on table "public"."gst_rate_rule" to "service_role";

grant update on table "public"."gst_rate_rule" to "service_role";

grant delete on table "public"."hsn_sac" to "anon";

grant insert on table "public"."hsn_sac" to "anon";

grant references on table "public"."hsn_sac" to "anon";

grant select on table "public"."hsn_sac" to "anon";

grant trigger on table "public"."hsn_sac" to "anon";

grant truncate on table "public"."hsn_sac" to "anon";

grant update on table "public"."hsn_sac" to "anon";

grant delete on table "public"."hsn_sac" to "authenticated";

grant insert on table "public"."hsn_sac" to "authenticated";

grant references on table "public"."hsn_sac" to "authenticated";

grant select on table "public"."hsn_sac" to "authenticated";

grant trigger on table "public"."hsn_sac" to "authenticated";

grant truncate on table "public"."hsn_sac" to "authenticated";

grant update on table "public"."hsn_sac" to "authenticated";

grant delete on table "public"."hsn_sac" to "service_role";

grant insert on table "public"."hsn_sac" to "service_role";

grant references on table "public"."hsn_sac" to "service_role";

grant select on table "public"."hsn_sac" to "service_role";

grant trigger on table "public"."hsn_sac" to "service_role";

grant truncate on table "public"."hsn_sac" to "service_role";

grant update on table "public"."hsn_sac" to "service_role";

grant delete on table "public"."hsn_sac_old" to "anon";

grant insert on table "public"."hsn_sac_old" to "anon";

grant references on table "public"."hsn_sac_old" to "anon";

grant select on table "public"."hsn_sac_old" to "anon";

grant trigger on table "public"."hsn_sac_old" to "anon";

grant truncate on table "public"."hsn_sac_old" to "anon";

grant update on table "public"."hsn_sac_old" to "anon";

grant delete on table "public"."hsn_sac_old" to "authenticated";

grant insert on table "public"."hsn_sac_old" to "authenticated";

grant references on table "public"."hsn_sac_old" to "authenticated";

grant select on table "public"."hsn_sac_old" to "authenticated";

grant trigger on table "public"."hsn_sac_old" to "authenticated";

grant truncate on table "public"."hsn_sac_old" to "authenticated";

grant update on table "public"."hsn_sac_old" to "authenticated";

grant delete on table "public"."hsn_sac_old" to "service_role";

grant insert on table "public"."hsn_sac_old" to "service_role";

grant references on table "public"."hsn_sac_old" to "service_role";

grant select on table "public"."hsn_sac_old" to "service_role";

grant trigger on table "public"."hsn_sac_old" to "service_role";

grant truncate on table "public"."hsn_sac_old" to "service_role";

grant update on table "public"."hsn_sac_old" to "service_role";

grant delete on table "public"."industry_templates" to "anon";

grant insert on table "public"."industry_templates" to "anon";

grant references on table "public"."industry_templates" to "anon";

grant select on table "public"."industry_templates" to "anon";

grant trigger on table "public"."industry_templates" to "anon";

grant truncate on table "public"."industry_templates" to "anon";

grant update on table "public"."industry_templates" to "anon";

grant delete on table "public"."industry_templates" to "authenticated";

grant insert on table "public"."industry_templates" to "authenticated";

grant references on table "public"."industry_templates" to "authenticated";

grant select on table "public"."industry_templates" to "authenticated";

grant trigger on table "public"."industry_templates" to "authenticated";

grant truncate on table "public"."industry_templates" to "authenticated";

grant update on table "public"."industry_templates" to "authenticated";

grant delete on table "public"."industry_templates" to "service_role";

grant insert on table "public"."industry_templates" to "service_role";

grant references on table "public"."industry_templates" to "service_role";

grant select on table "public"."industry_templates" to "service_role";

grant trigger on table "public"."industry_templates" to "service_role";

grant truncate on table "public"."industry_templates" to "service_role";

grant update on table "public"."industry_templates" to "service_role";

grant delete on table "public"."parser_audit_log" to "anon";

grant insert on table "public"."parser_audit_log" to "anon";

grant references on table "public"."parser_audit_log" to "anon";

grant select on table "public"."parser_audit_log" to "anon";

grant trigger on table "public"."parser_audit_log" to "anon";

grant truncate on table "public"."parser_audit_log" to "anon";

grant update on table "public"."parser_audit_log" to "anon";

grant delete on table "public"."parser_audit_log" to "authenticated";

grant insert on table "public"."parser_audit_log" to "authenticated";

grant references on table "public"."parser_audit_log" to "authenticated";

grant select on table "public"."parser_audit_log" to "authenticated";

grant trigger on table "public"."parser_audit_log" to "authenticated";

grant truncate on table "public"."parser_audit_log" to "authenticated";

grant update on table "public"."parser_audit_log" to "authenticated";

grant delete on table "public"."parser_audit_log" to "service_role";

grant insert on table "public"."parser_audit_log" to "service_role";

grant references on table "public"."parser_audit_log" to "service_role";

grant select on table "public"."parser_audit_log" to "service_role";

grant trigger on table "public"."parser_audit_log" to "service_role";

grant truncate on table "public"."parser_audit_log" to "service_role";

grant update on table "public"."parser_audit_log" to "service_role";


