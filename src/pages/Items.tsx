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
import { itemSchema } from '@/lib/validation';
import {
  Plus, X, Check, Info, CheckCircle, AlertCircle,
  Barcode, Tag, DollarSign, Package, Edit2, Trash2, Search,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Items() {
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filter items based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.sku?.toLowerCase().includes(query) ||
        item.hsn_sac_code?.toLowerCase().includes(query)
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, items]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('business_id', selectedBusiness?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
      setFilteredItems(data || []);
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

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku || '',
      hsn_sac_code: item.hsn_sac_code || '',
      gst_rate: item.gst_rate,
      unit_price: item.unit_price,
      unit_of_measure: item.unit_of_measure,
    });
    setHsnGstRate(item.gst_rate);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteItemId) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', deleteItemId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      });

      fetchItems();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteItemId(null);
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

    // Check item limit for free tier
    if (!editingItem) {
      const itemLimit = checkUsageLimit('item');
      if (!itemLimit.allowed) {
        toast({
          title: 'Item Limit Reached',
          description: `You've reached the limit of ${itemLimit.limit} items on the free plan. Upgrade to add unlimited items.`,
          variant: 'destructive',
        });
        setShowUpgradeModal(true);
        return;
      }
    }

    try {
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

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('items')
          .update({
            ...formData,
            gst_rate: Number(formData.gst_rate),
            unit_price: Number(formData.unit_price),
          })
          .eq('id', editingItem.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Item updated successfully',
        });
      } else {
        // Create new item
        const { data: newItem, error } = await supabase.from('items').insert({
          ...formData,
          business_id: selectedBusiness?.id,
          owner_id: user.id,
          gst_rate: Number(formData.gst_rate),
          unit_price: Number(formData.unit_price),
        }).select().single();

        if (error) throw error;

        // Track usage for new item
        trackUsage('item');

        toast({
          title: 'Success',
          description: 'Item added successfully',
        });

        setCreatedItemId(newItem.id);
        setShowWorkflowModal(true);
      }

      setShowForm(false);
      setEditingItem(null);
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

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      name: '',
      sku: '',
      hsn_sac_code: '',
      gst_rate: 0,
      unit_price: 0,
      unit_of_measure: 'kg',
    });
    setHsnGstRate(null);
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

        {/* Search Bar */}
        {!showForm && (
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search by name, SKU, or HSN/SAC code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                />
              </div>
            </CardContent>
          </Card>
        )}

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
                <p className="text-xs text-slate-500 font-medium">
                  {searchQuery ? 'Results' : 'Categories'}
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  {searchQuery
                    ? filteredItems.length
                    : new Set(items.map(item => item.hsn_sac_code)).size
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Item Form */}
        {showForm && (
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
            <CardHeader className="border-b border-slate-100 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    {editingItem ? <Edit2 className="h-6 w-6 text-white" /> : <Plus className="h-6 w-6 text-white" />}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      {editingItem ? 'Edit Item' : t('items.add')}
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      {editingItem ? 'Update the item details' : 'Fill in the item details below'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelForm}
                  className="hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
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
                        className={`border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 ${formData.hsn_sac_code ? 'bg-purple-50/50' : ''}`}
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

                <ValidationWarningBadge warnings={getValidationWarnings()} />

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/30"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {editingItem ? 'Update' : t('common.save')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelForm}
                    className="border-slate-200 hover:bg-slate-50"
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form >
            </CardContent >
          </Card >
        )
        }

        {/* Items Grid */}
        {
          filteredItems.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
                  {searchQuery ? <Search className="h-10 w-10 text-slate-400" /> : <Package className="h-10 w-10 text-slate-400" />}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {searchQuery ? 'No items found' : 'No items yet'}
                </h3>
                <p className="text-slate-500 mb-6">
                  {searchQuery ? 'Try a different search term' : 'Add your first item to get started'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/30"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                  <CardContent className="p-6 space-y-4">
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteItemId(item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

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

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the item from your inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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