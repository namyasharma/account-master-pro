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
import { validateGstRate, validateHsnGstMatch, ValidationWarning } from '@/lib/gstValidation';
import { logWorkflowShortcut } from '@/lib/telemetry';

interface LineItem {
  item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  gst_rate: number;
}

export default function CreateInvoice() {
  const [items, setItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    customer_id: '',
    buyer_name: '',
    buyer_gstin: '',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { item_id: null, description: '', quantity: 1, unit_price: 0, gst_rate: 0 }
  ]);
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
    fetchItems();
    fetchCustomers();
    
    // Handle prefill from workflow shortcuts
    const prefillItemId = searchParams.get('prefillItemId');
    const prefillCustomerId = searchParams.get('prefillCustomerId');
    
    if (prefillItemId) {
      fetchAndPrefillItem(prefillItemId);
    }
    
    if (prefillCustomerId) {
      fetchAndPrefillCustomer(prefillCustomerId);
    }
  }, [selectedBusiness, searchParams]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', selectedBusiness?.id)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchAndPrefillCustomer = async (customerId: string) => {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;

      if (customer) {
        setFormData(prev => ({
          ...prev,
          customer_id: customer.id,
          buyer_name: customer.name,
          buyer_gstin: customer.gstin || '',
        }));

        if (user?.id && selectedBusiness?.id) {
          logWorkflowShortcut({
            event_name: 'workflow_shortcut_used',
            user_id: user.id,
            business_id: selectedBusiness.id,
            shortcut_type: 'customer_to_invoice',
            metadata: { customer_id: customerId },
          });
        }

        toast({
          title: 'Customer prefilled',
          description: `Pre-filled with ${customer.name}`,
        });
      }
    } catch (error: any) {
      console.error('Failed to prefill customer:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('business_id', selectedBusiness?.id);

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
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
        // Prefill first line item with item data
        setLineItems([{
          item_id: item.id,
          description: item.name,
          quantity: 1,
          unit_price: Number(item.unit_price),
          gst_rate: Number(item.gst_rate),
        }]);

        // Log telemetry
        if (user?.id && selectedBusiness?.id) {
          logWorkflowShortcut({
            event_name: 'workflow_shortcut_used',
            user_id: user.id,
            business_id: selectedBusiness.id,
            shortcut_type: 'item_to_invoice',
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

  const handleItemSelect = (index: number, itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const updated = [...lineItems];
      updated[index] = {
        item_id: item.id,
        description: item.name,
        quantity: 1,
        unit_price: Number(item.unit_price),
        gst_rate: Number(item.gst_rate),
      };
      setLineItems(updated);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { item_id: null, description: '', quantity: 1, unit_price: 0, gst_rate: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let gstAmount = 0;

    lineItems.forEach(item => {
      const lineTotal = item.quantity * item.unit_price;
      const lineGST = lineTotal * (item.gst_rate / 100);
      subtotal += lineTotal;
      gstAmount += lineGST;
    });

    return { subtotal, gstAmount, total: subtotal + gstAmount };
  };

  const getLineItemValidationWarnings = (lineItem: LineItem, itemData: any): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];
    
    const rateWarning = validateGstRate(lineItem.gst_rate);
    if (rateWarning) warnings.push(rateWarning);

    if (itemData) {
      const matchWarning = validateHsnGstMatch(lineItem.gst_rate, itemData.gst_rate);
      if (matchWarning) warnings.push(matchWarning);
    }

    return warnings;
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customer_id: customer.id,
        buyer_name: customer.name,
        buyer_gstin: customer.gstin || '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { subtotal, gstAmount, total } = calculateTotals();

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          business_id: selectedBusiness?.id,
          invoice_number: formData.invoice_number,
          invoice_date: formData.invoice_date,
          customer_id: formData.customer_id || null,
          buyer_name: formData.buyer_name,
          buyer_gstin: formData.buyer_gstin,
          subtotal,
          gst_amount: gstAmount,
          total,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const lineItemsData = lineItems.map(item => ({
        invoice_id: invoice.id,
        item_id: item.item_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        gst_rate: item.gst_rate,
        line_total: item.quantity * item.unit_price,
        gst_amount: (item.quantity * item.unit_price * item.gst_rate) / 100,
      }));

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsData);

      if (lineItemsError) throw lineItemsError;

      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });
      
      navigate('/invoices');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('invoices.create')}</h1>
          <Button onClick={() => navigate('/invoices')}>Back</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <form onSubmit={handleSubmit}>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number">{t('invoices.number')}</Label>
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice_date">{t('invoices.date')}</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Select Customer (Optional)</Label>
                  <Select 
                    value={formData.customer_id} 
                    onValueChange={handleCustomerSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing customer or enter new" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyer_name">{t('invoices.buyerName')}</Label>
                  <Input
                    id="buyer_name"
                    value={formData.buyer_name}
                    onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyer_gstin">{t('invoices.buyerGSTIN')}</Label>
                  <Input
                    id="buyer_gstin"
                    value={formData.buyer_gstin}
                    onChange={(e) => setFormData({ ...formData, buyer_gstin: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.map((lineItem, index) => (
                <div key={index} className="border p-4 rounded space-y-4">
                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="space-y-2">
                      <Label>Select Item</Label>
                      <Select onValueChange={(value) => handleItemSelect(index, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map(item => (
                            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={lineItem.description}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[index].description = e.target.value;
                          setLineItems(updated);
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={lineItem.quantity}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[index].quantity = Number(e.target.value);
                          setLineItems(updated);
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={lineItem.unit_price}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[index].unit_price = Number(e.target.value);
                          setLineItems(updated);
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>GST Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={lineItem.gst_rate}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[index].gst_rate = Number(e.target.value);
                          setLineItems(updated);
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* Validation Warnings for this line item */}
                  {lineItem.item_id && (
                    <ValidationWarningBadge 
                      warnings={getLineItemValidationWarnings(
                        lineItem, 
                        items.find(i => i.id === lineItem.item_id)
                      )} 
                    />
                  )}

                  {lineItems.length > 1 && (
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeLineItem(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addLineItem}>
                Add Line Item
              </Button>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST:</span>
                  <span>₹{totals.gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>₹{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full">{t('common.save')}</Button>
        </form>
      </div>
    </div>
  );
}