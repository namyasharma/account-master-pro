import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

type Plan = 'free' | 'starter' | 'professional' | 'enterprise'
type Status = 'trialing' | 'active' | 'expired' | 'canceled'

interface Subscription {
  id: string
  user_id: string
  plan: Plan
  status: Status
  trial_start_date: string
  trial_end_date: string
  subscription_start_date: string | null
  subscription_end_date: string | null
  created_at: string
  updated_at: string
}

interface FeatureUsage {
  invoice_count: number
  item_count: number
  customer_count: number
  barcode_scan_count: number
}

const FREE_LIMITS = {
  invoice: 50,
  item: 100,
  customer: 50,
  barcode: 0,
}

export const useSubscription = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const subscriptionQuery = useQuery({
    queryKey: ['subscription', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Subscription> => {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user!.id)
            .maybeSingle()

        if (data) return data as Subscription

        if (error && error.code !== 'PGRST116') {
            throw error
        }

    const { data: created, error: createError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user!.id,
      plan: 'free',
      status: 'trialing',
      trial_start_date: new Date().toISOString(),
      trial_end_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    })
    .select('*')
    .single()

    if (createError || !created) {
    throw createError ?? new Error('Subscription creation failed')
  }
    return created as Subscription
    },
  })

  const usageQuery = useQuery({
    queryKey: ['usage', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<FeatureUsage> => {
      const { data, error } = await supabase
        .from('feature_usage')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (!error) return data

      if (error.code !== 'PGRST116') {
        throw error
      }

      const { data: created, error: createError } = await supabase
        .from('feature_usage')
        .insert({
          user_id: user!.id,
          invoice_count: 0,
          item_count: 0,
          customer_count: 0,
          barcode_scan_count: 0,
        })
        .select()
        .single()

      if (createError) throw createError
      return created
    },
  })

  const subscription = subscriptionQuery.data
  const usage = usageQuery.data

  const trialDaysRemaining = (): number => {
        if (!subscription?.trial_end_date) return 0;
        const today = new Date();
        const trialEnd = new Date(subscription.trial_end_date);
        const daysRemaining = Math.ceil((trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(daysRemaining, 0);
   }

  const isTrialActive = (() => {
    if (!subscription) return false
    if (subscription.status !== 'trialing') return false
    return new Date(subscription.trial_end_date) > new Date()
  })()

  const isActive =
    subscription?.status === 'active' || isTrialActive

  const hasFeatureAccess = (feature: string): boolean => {
    if (!subscription || !isActive) return false  

    const matrix: Record<string, Plan[]> = {
      barcode_scanning: ['starter', 'professional', 'enterprise'],
      unlimited_items: ['starter', 'professional', 'enterprise'],
      unlimited_customers: ['starter', 'professional', 'enterprise'],
      advanced_analytics: ['professional', 'enterprise'],
    }

    const allowedPlans = matrix[feature]
    if (!allowedPlans) return true

    return allowedPlans.includes(subscription.plan)
  }

  const getUsagePercentage = (
    type: 'invoice' | 'item' | 'customer'
  ): number => {
    if (!subscription || !usage) return 0
    if (subscription.plan !== 'free') return 0

    const limit = FREE_LIMITS[type]
    return Math.min((usage[`${type}_count`] / limit) * 100, 100)
  }

  const checkUsageLimit = (
  type: 'invoice' | 'item' | 'customer' | 'barcode'
): { allowed: boolean; current: number; limit: number } => {
  if (!subscription || !usage) {
    return { allowed: false, current: 0, limit: 0 };
  }

  // Paid plans have no limits
  if (subscription.plan !== 'free') {
    return { allowed: true, current: 0, limit: Infinity };
  }

  const limits = {
    invoice: 50,
    item: 100,
    customer: 50,
    barcode: 0,
  };

  const currentUsage = {
    invoice: usage.invoice_count,
    item: usage.item_count,
    customer: usage.customer_count,
    barcode: usage.barcode_scan_count,
  };

  const current = currentUsage[type];
  const limit = limits[type];

  return {
    allowed: current < limit,
    current,
    limit,
  };
};

  const trackUsage = useMutation({
    mutationFn: async (
      type: 'invoice' | 'item' | 'customer' | 'barcode'
    ) => {
      const field = `${type}_count`

      await supabase
        .from('feature_usage')
        .update({
          [field]: (usage as any)[field] + 1,
        })
        .eq('user_id', user!.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage', user?.id] })
    },
  })

  return {
    subscription,
    usage,

    isLoading:
      subscriptionQuery.isLoading || usageQuery.isLoading,

    isTrialing: subscription?.status === 'trialing',
    isActive,
    currentPlan: subscription?.plan ?? 'free',
    isPaid: subscription?.plan !== 'free',
    trialDaysRemaining: trialDaysRemaining(),
    hasFeatureAccess,
    getUsagePercentage,
    checkUsageLimit: checkUsageLimit,
    trackUsage: trackUsage.mutate,
    trackUsageAsync: trackUsage.mutateAsync,
    isTrackingUsage: trackUsage.isPending,
  }
}
