import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
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
    fetchInvoices();
  }, [selectedBusiness]);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('business_id', selectedBusiness?.id)
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
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
        <div className="container-responsive py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="font-bold">{t('invoices.title')}</h1>
          <Button onClick={() => navigate('/dashboard')} size="default">Back to Dashboard</Button>
        </div>
      </div>

      <div className="container-responsive p-responsive">
        <Link to="/invoices/create">
          <Button className="mb-4 w-full sm:w-auto" size="default">{t('invoices.create')}</Button>
        </Link>

        <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="card-responsive">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-semibold">{invoice.invoice_number}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-base md:text-lg font-semibold">₹{Number(invoice.total).toFixed(2)}</div>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        GST: ₹{Number(invoice.gst_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm md:text-base text-muted-foreground">{invoice.buyer_name}</p>
                    {invoice.buyer_gstin && (
                      <p className="text-xs md:text-sm text-muted-foreground">GSTIN: {invoice.buyer_gstin}</p>
                    )}
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