// supabase-custom-rpc.d.ts
import '@supabase/supabase-js';
import type { HsnCode } from '@/account-master-pro/src/components/HsnEmbeddings';
declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    rpc<T = unknown, P = Record<string, unknown>>(
      fn: string,
      params?: P
    ): import('@supabase/postgrest-js').PostgrestBuilder<T>;
  }
}

