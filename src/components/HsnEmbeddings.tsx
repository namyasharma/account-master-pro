import { supabase } from '@/integrations/supabase/client';
import { pipeline } from '@xenova/transformers';

let embedPipeline: any = null;

async function getPipeline() {
    if (!embedPipeline) {
        embedPipeline = await pipeline(
            'feature-extraction',
            'Xenova/all-MiniLM-L6-v2'
        );
    }
    return embedPipeline;
}

export interface HsnCode {
    id: string;
    subchapter_id: string;
    hsn_code: string;
    name: string;
    tax_rate: number;
    reverse_charge?: boolean;
    rate_type?: 'flat' | 'slab' | string;
    threshold_amount?: number;
    rate_below_threshold?: number;
    rate_above_threshold?: number;
}

// utility: mean-pool + normalize
function normalizeEmbedding(tensor: any): number[] {
    const vectors = tensor.data;
    const dims = tensor.dims[2];

    const pooled = new Array(dims).fill(0);
    for (let i = 0; i < vectors.length; i++) {
        pooled[i % dims] += vectors[i];
    }

    for (let i = 0; i < dims; i++) {
        pooled[i] /= tensor.dims[1];
    }

    const norm = Math.sqrt(pooled.reduce((s, v) => s + v * v, 0));
    return pooled.map(v => v / norm);
}

export async function searchHsnSemantic(
    query: string,
    limit = 100
): Promise<HsnCode[]> {

    if (!query || query.trim().length < 2) {
        const { data } = await supabase
            .from('hsn_code')
            .select('*')
            .order('hsn_code', { ascending: true })
            .limit(limit);

        return data ?? [];
    }

    try {
        const pipe = await getPipeline();

        const embeddingTensor = await pipe(query, {
            pooling: 'mean',
            normalize: true,
        });

        const embedding = normalizeEmbedding(embeddingTensor);

        console.log('Embedding dimensions:', embedding.length);
        console.log('Calling RPC with query:', query);

        const { data, error } = await supabase.rpc(
            'match_hsn_semantic',
            {
                query_vector: embedding,
                match_count: limit,
            }
        );

        if (error) {
            console.error('Semantic HSN search failed:', error);
            // Fallback to simple text search
            const { data: fallbackData } = await supabase
                .from('hsn_code')
                .select('*')
                .or(`hsn_code.ilike.%${query}%,name.ilike.%${query}%`)
                .limit(limit);

            return fallbackData ?? [];
        }

        console.log('RPC returned:', data);
        return (data as HsnCode[]) ?? [];
    } catch (err) {
        console.error('Error in searchHsnSemantic:', err);
        // Fallback to simple text search
        const { data: fallbackData } = await supabase
            .from('hsn_code')
            .select('*')
            .or(`hsn_code.ilike.%${query}%,name.ilike.%${query}%`)
            .limit(limit);

        return fallbackData ?? [];
    }
}