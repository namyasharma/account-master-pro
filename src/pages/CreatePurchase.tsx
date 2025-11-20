import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ValidationWarningBadge } from '@/components/ValidationWarningBadge';
import { validateGstRate, ValidationWarning } from '@/lib/gstValidation';
import { logWorkflowShortcut } from '@/lib/telemetry';

export default function CreatePurchase() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    entry_number: '',
    entry_date: new Date().toISOString().split('T')[0],
    supplier_id: '',
    supplier_name: '',
    supplier_gstin: '',
    subtotal: '',
    gst_amount: '',
  });
  const { selectedBusiness } = useBusiness();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!selectedBusiness) {
      navigate('/businesses');
      return;
    }
    
    fetchSuppliers();
    
    // Handle prefill from workflow shortcuts
    const prefillItemId = searchParams.get('prefillItemId');
    const prefillSupplierId = searchParams.get('prefillSupplierId');
    
    if (prefillItemId) {
      fetchAndPrefillItem(prefillItemId);
    }
    
    if (prefillSupplierId) {
      fetchAndPrefillSupplier(prefillSupplierId);
    }
  }, [selectedBusiness, searchParams]);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('business_id', selectedBusiness?.id)
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const fetchAndPrefillSupplier = async (supplierId: string) => {
    try {
      const { data: supplier, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .single();

      if (error) throw error;

      if (supplier) {
        setFormData(prev => ({
          ...prev,
          supplier_id: supplier.id,
          supplier_name: supplier.name,
          supplier_gstin: supplier.gstin || '',
        }));

        if (user?.id && selectedBusiness?.id) {
          logWorkflowShortcut({
            event_name: 'workflow_shortcut_used',
            user_id: user.id,
            business_id: selectedBusiness.id,
            shortcut_type: 'supplier_to_purchase',
            metadata: { supplier_id: supplierId },
          });
        }

        toast({
          title: 'Supplier prefilled',
          description: `Pre-filled with ${supplier.name}`,
        });
      }
    } catch (error: any) {
      console.error('Failed to prefill supplier:', error);
    }
  };

  const fetchAndPrefillItem = async (itemId: string) => {
    try {
      const { data: item, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;

      if (item) {
        // Prefill form with item data
        setFormData(prev => ({
          ...prev,
          subtotal: String(item.unit_price),
          gst_amount: String((item.unit_price * item.gst_rate) / 100),
        }));

        // Log telemetry
        if (user?.id && selectedBusiness?.id) {
          logWorkflowShortcut({
            event_name: 'workflow_shortcut_used',
            user_id: user.id,
            business_id: selectedBusiness.id,
            shortcut_type: 'item_to_purchase',
            metadata: { item_id: itemId },
          });
        }

        toast({
          title: 'Item prefilled',
          description: `Pre-filled with data from ${item.name}`,
        });
      }
    } catch (error: any) {
      console.error('Failed to prefill item:', error);
    }
  };

  const calculateTotal = () => {
    const subtotal = Number(formData.subtotal) || 0;
    const gstAmount = Number(formData.gst_amount) || 0;
    return subtotal + gstAmount;
  };

  const getValidationWarnings = (): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];
    
    const subtotal = Number(formData.subtotal) || 0;
    const gstAmount = Number(formData.gst_amount) || 0;
    
    // Check if GST is zero when subtotal is not
    if (gstAmount === 0 && subtotal > 0) {
      warnings.push({
        type: 'zero_gst_taxable',
        message: 'GST amount is zero but purchase has a subtotal - this may indicate a taxable purchase',
        severity: 'error',
      });
    }

    // Calculate effective GST rate and check if it's valid
    if (subtotal > 0 && gstAmount > 0) {
      const effectiveGstRate = (gstAmount / subtotal) * 100;
      const rateWarning = validateGstRate(effectiveGstRate);
      if (rateWarning) warnings.push(rateWarning);
    }

    return warnings;
  };

  const handleSupplierSelect = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setFormData({
        ...formData,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        supplier_gstin: supplier.gstin || '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase.from('purchase_entries').insert({
        business_id: selectedBusiness?.id,
        entry_number: formData.entry_number,
        entry_date: formData.entry_date,
        supplier_id: formData.supplier_id || null,
        supplier_name: formData.supplier_name,
        supplier_gstin: formData.supplier_gstin,
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
                <div className="space-y-2 md:col-span-2">
                  <Label>Select Supplier (Optional)</Label>
                  <Select 
                    value={formData.supplier_id} 
                    onValueChange={handleSupplierSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing supplier or enter new" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              {/* Validation Warnings */}
              <ValidationWarningBadge warnings={getValidationWarnings()} />

              <Button type="submit" className="w-full">{t('common.save')}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}