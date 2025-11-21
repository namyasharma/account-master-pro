import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText } from 'lucide-react';

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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

  const handleExportCSV = async () => {
    if (!selectedBusiness) return;
    
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-invoices-csv?business_id=${selectedBusiness.id}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${selectedBusiness.name}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Invoice data exported to CSV",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Could not export invoices",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async (invoiceId: string) => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-invoice-pdf?invoice_id=${invoiceId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Export failed');

      const html = await response.text();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }

      toast({
        title: "PDF ready",
        description: "Invoice opened in new window for printing",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Could not generate PDF",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container-responsive py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="font-bold">{t('invoices.title')}</h1>
          <Button onClick={() => navigate('/dashboard')} size="sm" variant="outline" className="border-primary/30 hover:bg-primary/10">
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="container-responsive p-responsive">
        <div className="flex gap-2 mb-4 flex-wrap">
          <Link to="/invoices/create" className="flex-1 sm:flex-none">
            <Button className="w-full" size="default">{t('invoices.create')}</Button>
          </Link>
          <Button 
            onClick={handleExportCSV}
            variant="outline"
            disabled={exporting || invoices.length === 0}
            size="default"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="card-responsive hover:shadow-lg hover:scale-[1.01] transition-all duration-200 border-primary/10">
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
                      <div className="text-base md:text-lg font-semibold text-primary">₹{Number(invoice.total).toFixed(2)}</div>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        GST: ₹{Number(invoice.gst_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-sm md:text-base text-muted-foreground">{invoice.buyer_name}</p>
                    {invoice.buyer_gstin && (
                      <p className="text-xs md:text-sm text-muted-foreground">GSTIN: {invoice.buyer_gstin}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleExportPDF(invoice.id)}
                    variant="outline"
                    size="sm"
                    disabled={exporting}
                    className="mt-2 w-full"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
