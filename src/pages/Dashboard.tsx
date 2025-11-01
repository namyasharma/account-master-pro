import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalPurchases: 0,
    netGST: 0,
  });
  const [loading, setLoading] = useState(true);
  const { selectedBusiness, setSelectedBusiness } = useBusiness();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedBusiness) {
      navigate('/businesses');
      return;
    }
    fetchDashboardData();
  }, [selectedBusiness]);

  const fetchDashboardData = async () => {
    try {
      const [invoicesResult, purchasesResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('total, gst_amount')
          .eq('business_id', selectedBusiness?.id),
        supabase
          .from('purchase_entries')
          .select('total, gst_amount')
          .eq('business_id', selectedBusiness?.id),
      ]);

      if (invoicesResult.error) throw invoicesResult.error;
      if (purchasesResult.error) throw purchasesResult.error;

      const totalSales = invoicesResult.data?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
      const outputGST = invoicesResult.data?.reduce((sum, inv) => sum + Number(inv.gst_amount), 0) || 0;
      const totalPurchases = purchasesResult.data?.reduce((sum, pur) => sum + Number(pur.total), 0) || 0;
      const inputGST = purchasesResult.data?.reduce((sum, pur) => sum + Number(pur.gst_amount), 0) || 0;
      const netGST = outputGST - inputGST;

      setStats({
        totalSales,
        totalPurchases,
        netGST,
      });
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

  const handleChangeBusiness = () => {
    setSelectedBusiness(null);
    navigate('/businesses');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{selectedBusiness?.name}</h1>
            <Button variant="link" onClick={handleChangeBusiness} className="px-0">
              Change Business
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <h2 className="text-3xl font-bold mb-6">{t('dashboard.title')}</h2>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('dashboard.totalSales')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalSales.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('dashboard.totalPurchases')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalPurchases.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('dashboard.netGST')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{Math.abs(stats.netGST).toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.netGST >= 0 ? t('dashboard.payable') : t('dashboard.refundable')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link to="/items">
            <Card className="cursor-pointer hover:bg-accent">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold">{t('items.title')}</h3>
              </CardContent>
            </Card>
          </Link>

          <Link to="/invoices">
            <Card className="cursor-pointer hover:bg-accent">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold">{t('invoices.title')}</h3>
              </CardContent>
            </Card>
          </Link>

          <Link to="/purchases">
            <Card className="cursor-pointer hover:bg-accent">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold">{t('purchases.title')}</h3>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}