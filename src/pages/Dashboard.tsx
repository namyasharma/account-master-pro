import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AnomalyDetection } from '@/components/AnomalyDetection';
import { Package, Truck, Users, FileText, Calendar, TrendingUp, ShoppingCart, TrendingDown, DollarSign, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              {selectedBusiness?.name}
            </h1>
            <Button
              variant="ghost"
              onClick={handleChangeBusiness}
              className="px-0 h-auto py-1 text-sm text-purple-600 hover:text-purple-700 hover:bg-transparent font-medium"
            >
              Switch Business →
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-slate-200 hover:bg-slate-50">
              <Calendar className="h-4 w-4 mr-2" />
              This Month
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
          {/* Total Sales Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg shadow-purple-100/50 bg-gradient-to-br from-white to-purple-50/30 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                {t('dashboard.totalSales')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                ₹{stats.totalSales.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-600 font-medium">+12.5%</span> from last month
              </p>
            </CardContent>
          </Card>

          {/* Total Purchases Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg shadow-blue-100/50 bg-gradient-to-br from-white to-blue-50/30 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                {t('dashboard.totalPurchases')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                ₹{stats.totalPurchases.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-orange-500" />
                <span className="text-orange-600 font-medium">-3.2%</span> from last month
              </p>
            </CardContent>
          </Card>

          {/* Net GST Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg shadow-emerald-100/50 bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                {t('dashboard.netGST')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                ₹{Math.abs(stats.netGST).toFixed(2)}
              </div>
              <p className="text-xs font-medium">
                {stats.netGST >= 0 ? (
                  <span className="text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    {t('dashboard.payable')}
                  </span>
                ) : (
                  <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {t('dashboard.refundable')}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Anomaly Detection Section */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border-0 p-6">
          <AnomalyDetection businessId={selectedBusiness.id} />
        </div>

        {/* Quick Actions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Quick Actions</h2>
            <Button variant="ghost" className="text-sm text-slate-600 hover:text-slate-800">
              View All →
            </Button>
          </div>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Link to="/items" className="block group">
              <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50 h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Package className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{t('items.title')}</h3>
                    <p className="text-xs text-slate-500">Manage inventory</p>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-5 w-5 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/suppliers" className="block group">
              <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50 h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Truck className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Suppliers</h3>
                    <p className="text-xs text-slate-500">Manage vendors</p>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/customers" className="block group">
              <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50 h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Customers</h3>
                    <p className="text-xs text-slate-500">Client database</p>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-5 w-5 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/invoices" className="block group">
              <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50 h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{t('invoices.title')}</h3>
                    <p className="text-xs text-slate-500">Generate bills</p>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-5 w-5 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}