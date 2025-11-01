import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Purchases() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedBusiness } = useBusiness();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedBusiness) {
      navigate('/businesses');
      return;
    }
    fetchPurchases();
  }, [selectedBusiness]);

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_entries')
        .select('*')
        .eq('business_id', selectedBusiness?.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('purchases.title')}</h1>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <Link to="/purchases/create">
          <Button className="mb-4">{t('purchases.add')}</Button>
        </Link>

        <div className="grid gap-4">
          {purchases.map((purchase) => (
            <Card key={purchase.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{purchase.entry_number}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(purchase.entry_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{purchase.supplier_name}</p>
                    {purchase.supplier_gstin && (
                      <p className="text-sm text-muted-foreground">GSTIN: {purchase.supplier_gstin}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">₹{Number(purchase.total).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      GST: ₹{Number(purchase.gst_amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}