import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function CreatePurchase() {
  const [formData, setFormData] = useState({
    entry_number: '',
    entry_date: new Date().toISOString().split('T')[0],
    supplier_name: '',
    supplier_gstin: '',
    subtotal: '',
    gst_amount: '',
  });
  const { selectedBusiness } = useBusiness();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedBusiness) {
      navigate('/businesses');
    }
  }, [selectedBusiness]);

  const calculateTotal = () => {
    const subtotal = Number(formData.subtotal) || 0;
    const gstAmount = Number(formData.gst_amount) || 0;
    return subtotal + gstAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase.from('purchase_entries').insert({
        ...formData,
        business_id: selectedBusiness?.id,
        subtotal: Number(formData.subtotal),
        gst_amount: Number(formData.gst_amount),
        total: calculateTotal(),
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Purchase entry created successfully',
      });
      
      navigate('/purchases');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('purchases.add')}</h1>
          <Button onClick={() => navigate('/purchases')}>Back</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Entry Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="entry_number">{t('purchases.entryNumber')}</Label>
                  <Input
                    id="entry_number"
                    value={formData.entry_number}
                    onChange={(e) => setFormData({ ...formData, entry_number: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entry_date">Date</Label>
                  <Input
                    id="entry_date"
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_name">{t('purchases.supplierName')}</Label>
                  <Input
                    id="supplier_name"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_gstin">{t('purchases.supplierGSTIN')}</Label>
                  <Input
                    id="supplier_gstin"
                    value={formData.supplier_gstin}
                    onChange={(e) => setFormData({ ...formData, supplier_gstin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtotal">Subtotal</Label>
                  <Input
                    id="subtotal"
                    type="number"
                    step="0.01"
                    value={formData.subtotal}
                    onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst_amount">GST Amount</Label>
                  <Input
                    id="gst_amount"
                    type="number"
                    step="0.01"
                    value={formData.gst_amount}
                    onChange={(e) => setFormData({ ...formData, gst_amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <Button type="submit" className="w-full">{t('common.save')}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}