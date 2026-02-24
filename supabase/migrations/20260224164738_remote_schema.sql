alter table "public"."businesses" alter column "industry" drop default;

alter type "public"."industry_type" rename to "industry_type__old_version_to_be_dropped";

create type "public"."industry_type" as enum ('general', 'retail', 'restaurant', 'manufacturing', 'services', 'healthcare', 'construction');

alter table "public"."businesses" alter column industry type "public"."industry_type" using industry::text::"public"."industry_type";

alter table "public"."businesses" alter column "industry" set default 'general'::public.industry_type;

drop type "public"."industry_type__old_version_to_be_dropped";

alter table "public"."invoices" add column "share_token" uuid default gen_random_uuid();

alter table "public"."purchase_entries" add column "cgst_amount" numeric(10,2) not null default 0;

alter table "public"."purchase_entries" add column "igst_amount" numeric(10,2) not null default 0;

alter table "public"."purchase_entries" add column "place_of_supply" character varying(2);

alter table "public"."purchase_entries" add column "sgst_amount" numeric(10,2) not null default 0;

CREATE UNIQUE INDEX idx_invoices_share_token ON public.invoices USING btree (share_token);


  create policy "Public invoice view by share token"
  on "public"."invoices"
  as permissive
  for select
  to public
using ((share_token IS NOT NULL));


CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


