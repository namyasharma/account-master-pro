import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { HsnCodeSelector } from '@/components/HsnCodeSelector';
import { ValidationWarningBadge } from '@/components/ValidationWarningBadge';
import { validateGstRate, validateHsnGstMatch, validateMissingHsn, ValidationWarning } from '@/lib/gstValidation';
import { WorkflowShortcutModal } from '@/components/WorkflowShortcutModal';
import { logWorkflowShortcut } from '@/lib/telemetry';
import { itemSchema } from '@/lib/validation';

export default function Items() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hsnGstRate, setHsnGstRate] = useState<number | null>(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    hsn_sac_code: '',
    gst_rate: 0,
    unit_price: 0,
    unit_of_measure: 'unit',
  });
  const { selectedBusiness } = useBusiness();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedBusiness) {
      navigate('/businesses');
      return;
    }
    fetchItems();
  }, [selectedBusiness]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('business_id', selectedBusiness?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create items',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Validate item data
      const validationResult = itemSchema.safeParse({
        name: formData.name,
        sku: formData.sku,
        hsn_sac_code: formData.hsn_sac_code,
        unit_price: Number(formData.unit_price),
        gst_rate: Number(formData.gst_rate),
        unit_of_measure: formData.unit_of_measure,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => e.message).join(', ');
        toast({
          title: 'Validation Error',
          description: errors,
          variant: 'destructive',
        });
        return;
      }

      const { data: newItem, error } = await supabase.from('items').insert({
        ...formData,
        business_id: selectedBusiness?.id,
        owner_id: user.id,
        gst_rate: Number(formData.gst_rate),
        unit_price: Number(formData.unit_price),
      }).select().single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Item added successfully',
      });
      
      setShowForm(false);
      setCreatedItemId(newItem.id);
      setShowWorkflowModal(true);
      
      setFormData({
        name: '',
        sku: '',
        hsn_sac_code: '',
        gst_rate: 0,
        unit_price: 0,
        unit_of_measure: 'unit',
      });
      setHsnGstRate(null);
      fetchItems();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getValidationWarnings = (): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];
    
    const rateWarning = validateGstRate(formData.gst_rate);
    if (rateWarning) warnings.push(rateWarning);

    const hsnWarning = validateMissingHsn(formData.hsn_sac_code);
    if (hsnWarning) warnings.push(hsnWarning);

    const matchWarning = validateHsnGstMatch(formData.gst_rate, hsnGstRate);
    if (matchWarning) warnings.push(matchWarning);

    return warnings;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('items.title')}</h1>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="mb-4">
            {t('items.add')}
          </Button>
        )}

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('items.add')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('items.name')}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">{t('items.sku')}</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hsn_sac_code">{t('items.hsnSac')}</Label>
                    <HsnCodeSelector
                      value={formData.hsn_sac_code}
                      onSelect={(hsnCode, gstRate, description) => {
                        setHsnGstRate(gstRate);
                        setFormData({
                          ...formData,
                          hsn_sac_code: hsnCode,
                          gst_rate: gstRate,
                        });
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Search by HSN/SAC code or description
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gst_rate">{t('items.gstRate')} (%)</Label>
                    <Input
                      id="gst_rate"
                      type="number"
                      step="0.01"
                      value={formData.gst_rate}
                      onChange={(e) => setFormData({ ...formData, gst_rate: parseFloat(e.target.value) || 0 })}
                      required
                      readOnly={!!formData.hsn_sac_code}
                      className={formData.hsn_sac_code ? 'bg-muted' : ''}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.hsn_sac_code 
                        ? 'Auto-filled from HSN/SAC code' 
                        : 'Select HSN/SAC code to auto-fill'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_price">{t('items.unitPrice')}</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_of_measure">{t('items.unitOfMeasure')}</Label>
                    <Input
                      id="unit_of_measure"
                      value={formData.unit_of_measure}
                      onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                      required
                    />
                  </div>

                  {/* Validation Warnings */}
                  <ValidationWarningBadge warnings={getValidationWarnings()} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{t('common.save')}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    {item.sku && <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>}
                    {item.hsn_sac_code && <p className="text-sm text-muted-foreground">HSN/SAC: {item.hsn_sac_code}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">₹{Number(item.unit_price).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">GST: {Number(item.gst_rate).toFixed(2)}%</p>
                    <p className="text-sm text-muted-foreground">{item.unit_of_measure}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <WorkflowShortcutModal
          open={showWorkflowModal}
          onOpenChange={(open) => {
            setShowWorkflowModal(open);
            if (!open) setCreatedItemId(null);
          }}
          title="Item created successfully!"
          description="What would you like to do next?"
          actions={[
            {
              label: 'Create Purchase',
              path: `/purchases/create?prefillItemId=${createdItemId}`,
            },
            {
              label: 'Create Invoice',
              path: `/invoices/create?prefillItemId=${createdItemId}`,
            },
          ]}
        />
      </div>
    </div>
  );
}