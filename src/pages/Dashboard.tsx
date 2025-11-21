import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AnomalyDetection } from '@/components/AnomalyDetection';
import { Package, Truck, Users, FileText } from 'lucide-react';

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
    <div className="p-responsive space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="font-bold">{selectedBusiness?.name}</h1>
          <Button variant="link" onClick={handleChangeBusiness} className="px-0 h-auto py-0 text-sm text-primary hover:text-primary-dark">
            Change Business
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="card-responsive border-primary/10 hover:border-primary/30 transition-colors">
          <CardHeader className="p-3 md:p-4">
            <CardTitle className="text-xs md:text-sm text-muted-foreground">{t('dashboard.totalSales')}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-lg md:text-xl lg:text-2xl font-bold text-primary">₹{stats.totalSales.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="card-responsive border-primary/10 hover:border-primary/30 transition-colors">
          <CardHeader className="p-3 md:p-4">
            <CardTitle className="text-xs md:text-sm text-muted-foreground">{t('dashboard.totalPurchases')}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-lg md:text-xl lg:text-2xl font-bold text-primary">₹{stats.totalPurchases.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="card-responsive border-primary/10 hover:border-primary/30 transition-colors">
          <CardHeader className="p-3 md:p-4">
            <CardTitle className="text-xs md:text-sm text-muted-foreground">{t('dashboard.netGST')}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-lg md:text-xl lg:text-2xl font-bold text-primary">₹{Math.abs(stats.netGST).toFixed(2)}</div>
            <p className="text-xs md:text-sm text-muted-foreground">
              {stats.netGST >= 0 ? t('dashboard.payable') : t('dashboard.refundable')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly Detection Section */}
      <div className="mb-3 md:mb-4">
        <AnomalyDetection businessId={selectedBusiness.id} />
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        <Link to="/items" className="block">
          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] h-[56px] card-responsive border-primary/20 hover:border-primary">
            <CardContent className="p-3 flex items-center gap-3 h-full">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Package className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold truncate">{t('items.title')}</h3>
            </CardContent>
          </Card>
        </Link>

        <Link to="/suppliers" className="block">
          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] h-[56px] card-responsive border-primary/20 hover:border-primary">
            <CardContent className="p-3 flex items-center gap-3 h-full">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Truck className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold truncate">Suppliers</h3>
            </CardContent>
          </Card>
        </Link>

        <Link to="/customers" className="block">
          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] h-[56px] card-responsive border-primary/20 hover:border-primary">
            <CardContent className="p-3 flex items-center gap-3 h-full">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold truncate">Customers</h3>
            </CardContent>
          </Card>
        </Link>

        <Link to="/invoices" className="block">
          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] h-[56px] card-responsive border-primary/20 hover:border-primary">
            <CardContent className="p-3 flex items-center gap-3 h-full">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold truncate">{t('invoices.title')}</h3>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}