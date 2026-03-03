import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
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
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { itemSchema } from '@/lib/validation';
import {
  Plus, X, Check, Info, CheckCircle, AlertCircle,
  Barcode, Tag, DollarSign, Package, Edit2, Trash2, Search,
  MoreVertical, Lock, Crown
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
import { Badge } from "@/components/ui/badge"; // ADD THIS

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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

  // ADD SUBSCRIPTION HOOK
  const {
    checkUsageLimit,
    trackUsage,
    getUsagePercentage,
    isPaid,
    subscription,
    usage
  } = useSubscription();

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

    // ✅ CHECK ITEM LIMIT FOR FREE TIER (MODIFIED)
    if (!editingItem) {
      const itemLimit = checkUsageLimit('item');
      if (!itemLimit.allowed) {
        toast({
          title: 'Item Limit Reached',
          description: `You've reached the limit of ${itemLimit.limit} items on the free plan. Upgrade to add unlimited items.`,
          variant: 'destructive',
        });
        setShowUpgradeModal(true); // Show upgrade modal
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

        // ✅ TRACK USAGE FOR NEW ITEM
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

  // ✅ GET USAGE STATS
  const itemUsage = checkUsageLimit('item');
  const usagePercentage = getUsagePercentage('item');

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

        {/* ✅ USAGE LIMIT BANNER (FREE TIER ONLY) */}
        {!isPaid && !showForm && (
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-slate-800">
                      Item Usage: {itemUsage.current} / {itemUsage.limit}
                    </h3>
                    {itemUsage.current >= itemUsage.limit * 0.8 && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {itemUsage.current >= itemUsage.limit ? 'Limit Reached' : 'Almost Full'}
                      </Badge>
                    )}
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${usagePercentage >= 100
                        ? 'bg-red-500'
                        : usagePercentage >= 80
                          ? 'bg-amber-500'
                          : 'bg-purple-500'
                        }`}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    {itemUsage.current >= itemUsage.limit
                      ? 'Upgrade to add unlimited items'
                      : `${itemUsage.limit - itemUsage.current} items remaining`}
                  </p>
                </div>
                {itemUsage.current >= itemUsage.limit * 0.8 && (
                  <Button
                    onClick={() => navigate('/pricing')}
                    variant="outline"
                    size="sm"
                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
                <p className="text-2xl font-bold text-slate-800">
                  {items.length}
                  {/* ✅ SHOW LIMIT FOR FREE TIER */}
                  {!isPaid && (
                    <span className="text-sm font-normal text-slate-500 ml-1">
                      / {itemUsage.limit}
                    </span>
                  )}
                </p>
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

        {/* Add/Edit Item Form - REST OF THE CODE REMAINS THE SAME */}
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
                {/* Barcode Scanner Button */}
                <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                          <Scan className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 flex items-center gap-2">
                            Quick Add with Barcode
                            {!hasFeatureAccess('barcode_scanning') ? (
                              <Lock className="h-4 w-4 text-purple-500" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-purple-500" />
                            )}
                          </p>
                          <p className="text-xs text-slate-500">
                            {scannedBarcode
                              ? `Scanned: ${scannedBarcode}`
                              : hasFeatureAccess('barcode_scanning')
                                ? 'Scan to auto-populate item details'
                                : `Available on Starter plan and above • Current: ${currentPlan}`
                            }
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          if (!hasFeatureAccess('barcode_scanning')) {
                            setShowUpgradeModal(true);
                          } else {
                            setShowBarcodeScanner(true);
                          }
                        }}
                        disabled={lookingUpProduct}
                        className={
                          hasFeatureAccess('barcode_scanning')
                            ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
                            : "bg-gradient-to-r from-slate-400 to-slate-500"
                        }
                      >
                        {lookingUpProduct ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Looking up...
                          </>
                        ) : !hasFeatureAccess('barcode_scanning') ? (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Unlock Feature
                          </>
                        ) : (
                          <>
                            <Barcode className="mr-2 h-4 w-4" />
                            Scan Barcode
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

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

            {/* ✅ UPGRADE MODAL */}
            <UpgradePrompt
              open={showUpgradeModal}
              onOpenChange={setShowUpgradeModal}
              feature="unlimited_items"
              featureName="Unlimited Items"
              featureDescription="Add unlimited items to your inventory without any restrictions"
            />

            {/* ✅ DELETE CONFIRMATION DIALOG */}
            <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this item. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* ✅ WORKFLOW MODAL */}
            <WorkflowShortcutModal
              open={showWorkflowModal}
              title='Next Steps'
              description='Continue with your workflow after adding a new item.'
              onOpenChange={setShowWorkflowModal}
              createdItemId={createdItemId}
            />
          </div>
    </div>
      );
}