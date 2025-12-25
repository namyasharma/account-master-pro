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
import {
  Plus, X, Check, Info, CheckCircle, AlertCircle,
  Barcode, Tag, DollarSign, Package
} from 'lucide-react';
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
    unit_of_measure: 'kg',
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
        unit_of_measure: 'kg',
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
  const hsnSearchHint = formData.name.trim();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              {t('items.title')}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your product inventory
            </p>
          </div>

          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/30"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('items.add')}
            </Button>
          )}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Items</p>
                <p className="text-2xl font-bold text-slate-800">{items.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Avg. Price</p>
                <p className="text-2xl font-bold text-slate-800">
                  ₹{items.length > 0 ? (items.reduce((sum, item) => sum + Number(item.unit_price), 0) / items.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Tag className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Categories</p>
                <p className="text-2xl font-bold text-slate-800">
                  {new Set(items.map(item => item.hsn_sac_code)).size}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Item Form */}
        {showForm && (
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
            <CardHeader className="border-b border-slate-100 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{t('items.add')}</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">Fill in the item details below</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowForm(false)}
                  className="hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Item Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                      {t('items.name')}
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                      placeholder="Enter item name"
                    />
                  </div>

                  {/* SKU */}
                  <div className="space-y-2">
                    <Label htmlFor="sku" className="text-sm font-semibold text-slate-700">
                      {t('items.sku')}
                    </Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                      placeholder="Stock keeping unit"
                    />
                  </div>

                  {/* HSN/SAC Code */}
                  <div className="space-y-2">
                    <Label htmlFor="hsn_sac_code" className="text-sm font-semibold text-slate-700">
                      {t('items.hsnSac')}
                    </Label>
                    <HsnCodeSelector
                      value={formData.hsn_sac_code}
                      searchHint={formData.name}
                      onSelect={(hsnCode, gstRate) => {
                        setHsnGstRate(gstRate);
                        setFormData({
                          ...formData,
                          hsn_sac_code: hsnCode,
                          gst_rate: gstRate,
                        });
                      }}
                    />
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Search by HSN/SAC code or description
                    </p>
                  </div>

                  {/* GST Rate */}
                  <div className="space-y-2">
                    <Label htmlFor="gst_rate" className="text-sm font-semibold text-slate-700">
                      {t('items.gstRate')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="gst_rate"
                        type="number"
                        step="0.01"
                        value={formData.gst_rate}
                        onChange={(e) => setFormData({ ...formData, gst_rate: parseFloat(e.target.value) || 0 })}
                        required
                        readOnly={!!formData.hsn_sac_code}
                        className={`border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 ${formData.hsn_sac_code ? 'bg-purple-50/50' : ''
                          }`}
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      {formData.hsn_sac_code ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-emerald-500" />
                          Auto-filled from HSN/SAC code
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 text-amber-500" />
                          Select HSN/SAC code to auto-fill
                        </>
                      )}
                    </p>
                  </div>

                  {/* Unit Price */}
                  <div className="space-y-2">
                    <Label htmlFor="unit_price" className="text-sm font-semibold text-slate-700">
                      {t('items.unitPrice')}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                      <Input
                        id="unit_price"
                        type="number"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                        required
                        className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 pl-8"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Unit of Measure */}
                  <div className="space-y-2">
                    <Label htmlFor="unit_of_measure" className="text-sm font-semibold text-slate-700">
                      {t('items.unitOfMeasure')}
                    </Label>
                    <Input
                      id="unit_of_measure"
                      value={formData.unit_of_measure}
                      onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                      required
                      className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                      placeholder="e.g., Piece, Kg, Liter"
                    />
                  </div>
                </div>

                {/* Validation Warnings */}
                <ValidationWarningBadge warnings={getValidationWarnings()} />

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/30"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {t('common.save')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="border-slate-200 hover:bg-slate-50"
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Items Grid */}
        {items.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
                <Package className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No items yet</h3>
              <p className="text-slate-500 mb-6">Add your first item to get started</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/30"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white"
              >
                {/* Gradient accent on hover */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                <CardContent className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-800 truncate">
                        {item.name}
                      </h3>
                      {item.sku && (
                        <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                          <Barcode className="h-3 w-3" />
                          {item.sku}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    {item.hsn_sac_code && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">HSN/SAC:</span>
                        <span className="font-medium text-slate-700 font-mono">{item.hsn_sac_code}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">GST Rate:</span>
                      <span className="font-semibold text-purple-600">{Number(item.gst_rate).toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Unit:</span>
                      <span className="font-medium text-slate-700">{item.unit_of_measure}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Unit Price</span>
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      ₹{Number(item.unit_price).toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Workflow Modal */}
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