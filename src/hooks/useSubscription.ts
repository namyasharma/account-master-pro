import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'trialing' | 'active' | 'expired' | 'canceled';
  trial_start_date: string;
  trial_end_date: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  razorpay_subscription_id: string | null;
  razorpay_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

interface FeatureUsage {
  id: string;
  user_id: string;
  invoice_count: number;
  item_count: number;
  customer_count: number;
  barcode_scan_count: number;
  last_reset_date: string;
  created_at: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch subscription data
  const {
    data: subscription,
    isLoading: isLoadingSubscription,
    error: subscriptionError,
  } = useQuery<Subscription | null>({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If no subscription exists, create one with free plan
      if (error && error.code === 'PGRST116') {
        const { data: newSub, error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan: 'free',
            status: 'trialing',
            trial_start_date: new Date().toISOString(),
            trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newSub as Subscription;
      }

      if (error) throw error;
      return data as Subscription;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch usage data
  const {
    data: usage,
    isLoading: isLoadingUsage,
  } = useQuery<FeatureUsage | null>({
    queryKey: ['usage', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('feature_usage')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If no usage record exists, create one
      if (error && error.code === 'PGRST116') {
        const { data: newUsage, error: insertError } = await supabase
          .from('feature_usage')
          .insert({
            user_id: user.id,
            invoice_count: 0,
            item_count: 0,
            customer_count: 0,
            barcode_scan_count: 0,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newUsage;
      }

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
  });

  // Check if user has access to a specific feature
  const hasFeatureAccess = (feature: string): boolean => {
    if (!subscription) return false;

    const now = new Date();
    const trialEnd = new Date((subscription as Subscription).trial_end_date);
    const isTrialActive = (subscription as Subscription).status === 'trialing' && trialEnd > now;
    const isActive = (subscription as Subscription).status === 'active';

    // If subscription is not active or trial is expired
    if (!isTrialActive && !isActive) {
      return false;
    }

    // Feature access matrix
    const featureMap: Record<string, string[]> = {
      barcode_scanning: ['starter', 'professional', 'enterprise'],
      unlimited_invoices: ['starter', 'professional', 'enterprise'],
      unlimited_items: ['starter', 'professional', 'enterprise'],
      unlimited_customers: ['starter', 'professional', 'enterprise'],
      advanced_analytics: ['professional', 'enterprise'],
      multi_user: ['enterprise'],
      whatsapp_integration: ['enterprise'],
    };

    const allowedPlans = featureMap[feature];
    if (!allowedPlans) return true; // Feature not in map = free feature

    return allowedPlans.includes((subscription as Subscription).plan);
  };

  // Check if user has reached usage limits (for free tier)
  const checkUsageLimit = (
    type: 'invoice' | 'item' | 'customer' | 'barcode'
  ): { allowed: boolean; current: number; limit: number } => {
    // Paid plans have no limits
    if ((subscription as Subscription)?.plan !== 'free') {
      return { allowed: true, current: 0, limit: Infinity };
    }

    if (!usage) {
      return { allowed: true, current: 0, limit: 0 };
    }

    const limits = {
      invoice: 50,
      item: 100,
      customer: 50,
      barcode: 0, // Barcode is paid-only
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

  // Get usage percentage for progress bars
  const getUsagePercentage = (type: 'invoice' | 'item' | 'customer'): number => {
    const { current, limit } = checkUsageLimit(type);
    if (limit === Infinity) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  // Track usage (increment counters)
  const trackUsage = useMutation({
    mutationFn: async (type: 'invoice' | 'item' | 'customer' | 'barcode') => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get current usage
      const { data: currentUsage } = await supabase
        .from('feature_usage')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!currentUsage) {
        // Create initial usage record
        const { error } = await supabase.from('feature_usage').insert({
          user_id: user.id,
          invoice_count: type === 'invoice' ? 1 : 0,
          item_count: type === 'item' ? 1 : 0,
          customer_count: type === 'customer' ? 1 : 0,
          barcode_scan_count: type === 'barcode' ? 1 : 0,
        });
        if (error) throw error;
      } else {
        // Increment the appropriate counter
        const updates: Partial<FeatureUsage> = {};
        
        switch (type) {
          case 'invoice':
            updates.invoice_count = currentUsage.invoice_count + 1;
            break;
          case 'item':
            updates.item_count = currentUsage.item_count + 1;
            break;
          case 'customer':
            updates.customer_count = currentUsage.customer_count + 1;
            break;
          case 'barcode':
            updates.barcode_scan_count = currentUsage.barcode_scan_count + 1;
            break;
        }

        const { error } = await supabase
          .from('feature_usage')
          .update(updates)
          .eq('user_id', user.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      // Invalidate usage query to refetch
      queryClient.invalidateQueries({ queryKey: ['usage', user?.id] });
    },
  });

  // Get trial days remaining
  const trialDaysRemaining = (): number => {
    if (!subscription || (subscription as Subscription).status !== 'trialing') return 0;
    
    const end = new Date((subscription as Subscription).trial_end_date);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    return Math.max(0, days);
  };

  // Check if trial is expiring soon (within 3 days)
  const isTrialExpiringSoon = (): boolean => {
    if (!subscription) return false;
    const daysLeft = trialDaysRemaining();
    return (subscription as Subscription).status === 'trialing' && daysLeft <= 3 && daysLeft > 0;
  };

  // Update subscription (after payment)
  const updateSubscription = useMutation({
    mutationFn: async (updates: Partial<Subscription>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('subscriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
    },
  });

  // Cancel subscription
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
    },
  });

  // Reset usage (for monthly resets - should be done by a cron job)
  const resetUsage = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('feature_usage')
        .update({
          invoice_count: 0,
          item_count: 0,
          customer_count: 0,
          barcode_scan_count: 0,
          last_reset_date: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage', user?.id] });
    },
  });

  return {
    // Data
    subscription,
    usage,
    isLoading: isLoadingSubscription || isLoadingUsage,
    error: subscriptionError,

    // Feature access
    hasFeatureAccess,
    checkUsageLimit,
    getUsagePercentage,

    // Trial info
    trialDaysRemaining,
    isTrialExpiringSoon,
    isTrialing: (subscription as Subscription)?.status === 'trialing',

    // Plan info
    isPaid: (subscription as Subscription)?.plan !== 'free',
    currentPlan: (subscription as Subscription).plan || 'free',
    isActive: (subscription as Subscription)?.status === 'active',

    // Mutations
    trackUsage: trackUsage.mutate,
    trackUsageAsync: trackUsage.mutateAsync,
    updateSubscription: updateSubscription.mutate,
    cancelSubscription: cancelSubscription.mutate,
    resetUsage: resetUsage.mutate,

    // Loading states
    isTrackingUsage: trackUsage.isPending,
    isUpdatingSubscription: updateSubscription.isPending,
  };
};

// Convenience hook for checking single feature
export const useFeatureAccess = (feature: string) => {
  const { hasFeatureAccess, isLoading } = useSubscription();
  return {
    hasAccess: hasFeatureAccess(feature),
    isLoading,
  };
};

// Convenience hook for checking usage limit
export const useUsageLimit = (type: 'invoice' | 'item' | 'customer') => {
  const { checkUsageLimit, isLoading } = useSubscription();
  return {
    ...checkUsageLimit(type),
    isLoading,
  };
};