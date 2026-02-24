import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBusiness } from "@/contexts/BusinessContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ValidationWarningBadge } from "@/components/ValidationWarningBadge";
import {
  validateGstRate,
  validateHsnGstMatch,
  ValidationWarning,
} from "@/lib/gstValidation";
import { invoiceSchema } from "@/lib/validation";

const INDIAN_STATES = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "25", name: "Daman and Diu" },
  { code: "26", name: "Dadra and Nagar Haveli" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" },
  { code: "99", name: "Centre Jurisdiction" },
];

interface LineItem {
  item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  gst_rate: number;
  hsn_sac_code: string;
}

export default function EditInvoice() {
  const { id } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    invoice_number: "",
    invoice_date: new Date().toISOString().split("T")[0],
    customer_id: "",
    buyer_name: "",
    buyer_gstin: "",
    place_of_supply: "",
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      item_id: null,
      description: "",
      quantity: 1,
      unit_price: 0,
      gst_rate: 0,
      hsn_sac_code: "",
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { selectedBusiness } = useBusiness();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedBusiness) {
      navigate("/businesses");
      return;
    }
    fetchItems();
    fetchCustomers();
    fetchInvoice();
  }, [selectedBusiness, id]);

  const fetchInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          *,
          invoice_line_items(*)
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      // Load invoice data
      setFormData({
        invoice_number: data.invoice_number,
        invoice_date: data.invoice_date,
        customer_id: data.customer_id || "",
        buyer_name: data.buyer_name,
        buyer_gstin: data.buyer_gstin || "",
        place_of_supply: data.place_of_supply || "",
      });

      // Load line items
      if (data.invoice_line_items && data.invoice_line_items.length > 0) {
        setLineItems(
          data.invoice_line_items.map((item: any) => ({
            item_id: item.item_id,
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            gst_rate: Number(item.gst_rate),
            hsn_sac_code: item.hsn_sac_code || "",
          })),
        );
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/invoices");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("business_id", selectedBusiness?.id)
        .order("name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("business_id", selectedBusiness?.id);

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleItemSelect = (index: number, itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      const updated = [...lineItems];
      updated[index] = {
        item_id: item.id,
        description: item.name,
        quantity: 1,
        unit_price: Number(item.unit_price),
        gst_rate: Number(item.gst_rate),
        hsn_sac_code: item.hsn_sac_code || "",
      };
      setLineItems(updated);
    }
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        item_id: null,
        description: "",
        quantity: 1,
        unit_price: 0,
        gst_rate: 0,
        hsn_sac_code: "",
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateGSTSplit = (gstAmount: number) => {
    const sellerStateCode = selectedBusiness?.state_code;
    const buyerStateCode = formData.buyer_gstin?.substring(0, 2);
    const posStateCode = formData.place_of_supply;
    const effectiveBuyerState = buyerStateCode || posStateCode;

    if (!effectiveBuyerState || !sellerStateCode) {
      return { cgst: gstAmount / 2, sgst: gstAmount / 2, igst: 0 };
    }

    if (effectiveBuyerState === sellerStateCode) {
      return { cgst: gstAmount / 2, sgst: gstAmount / 2, igst: 0 };
    } else {
      return { cgst: 0, sgst: 0, igst: gstAmount };
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let gstAmount = 0;

    lineItems.forEach((item) => {
      const lineTotal = item.quantity * item.unit_price;
      const lineGST = lineTotal * (item.gst_rate / 100);
      subtotal += lineTotal;
      gstAmount += lineGST;
    });

    const gstSplit = calculateGSTSplit(gstAmount);
    return {
      subtotal,
      gstAmount,
      total: subtotal + gstAmount,
      cgst: gstSplit.cgst,
      sgst: gstSplit.sgst,
      igst: gstSplit.igst,
    };
  };

  const handleBuyerGSTINChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      buyer_gstin: value,
      place_of_supply:
        value.length >= 2 ? value.substring(0, 2) : prev.place_of_supply,
    }));
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      const gstin = customer.gstin || "";
      setFormData({
        ...formData,
        customer_id: customer.id,
        buyer_name: customer.name,
        buyer_gstin: gstin,
        place_of_supply: gstin.length >= 2 ? gstin.substring(0, 2) : "",
      });
    }
  };

  const getLineItemValidationWarnings = (
    lineItem: LineItem,
    itemData: any,
  ): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];
    const rateWarning = validateGstRate(lineItem.gst_rate);
    if (rateWarning) warnings.push(rateWarning);
    if (itemData) {
      const matchWarning = validateHsnGstMatch(
        lineItem.gst_rate,
        itemData.gst_rate,
      );
      if (matchWarning) warnings.push(matchWarning);
    }
    return warnings;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!selectedBusiness?.id) {
        toast({
          title: "Validation Error",
          description: "Please select a business",
          variant: "destructive",
        });
        return;
      }

      if (lineItems.length === 0) {
        toast({
          title: "Validation Error",
          description: "Invoice must have at least one line item",
          variant: "destructive",
        });
        return;
      }

      const { subtotal, gstAmount, total, cgst, sgst, igst } =
        calculateTotals();

      const validationResult = invoiceSchema.safeParse({
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        buyer_name: formData.buyer_name,
        buyer_gstin: formData.buyer_gstin,
        subtotal,
        gst_amount: gstAmount,
        total,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.errors
          .map((e) => e.message)
          .join(", ");
        toast({
          title: "Validation Error",
          description: errors,
          variant: "destructive",
        });
        return;
      }

      setSaving(true);

      // Update invoice
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({
          invoice_number: formData.invoice_number,
          invoice_date: formData.invoice_date,
          customer_id: formData.customer_id || null,
          buyer_name: formData.buyer_name,
          buyer_gstin: formData.buyer_gstin,
          place_of_supply: formData.place_of_supply || null,
          subtotal,
          gst_amount: gstAmount,
          cgst_amount: cgst,
          sgst_amount: sgst,
          igst_amount: igst,
          total,
        })
        .eq("id", id);

      if (invoiceError) throw invoiceError;

      // Delete old line items
      await supabase.from("invoice_line_items").delete().eq("invoice_id", id);

      // Insert new line items
      const lineItemsData = lineItems.map((item) => ({
        invoice_id: id!,
        item_id: item.item_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        gst_rate: item.gst_rate,
        hsn_sac_code: item.hsn_sac_code || null,
        line_total: item.quantity * item.unit_price,
        gst_amount: (item.quantity * item.unit_price * item.gst_rate) / 100,
      }));

      const { error: lineItemsError } = await supabase
        .from("invoice_line_items")
        .insert(lineItemsData);

      if (lineItemsError) throw lineItemsError;

      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });

      navigate("/invoices");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="p-responsive space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="font-bold">Edit Invoice</h1>
        <Button
          onClick={() => navigate("/invoices")}
          size="sm"
          variant="outline"
          className="border-primary/30 hover:bg-primary/10"
        >
          Back
        </Button>
      </div>

      {/* Copy the entire form from CreateInvoice.tsx here */}
      {/* Just use the same JSX but change the submit button text */}

      <div className="space-y-4">
        <form onSubmit={handleSubmit}>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number">{t("invoices.number")}</Label>
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        invoice_number: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice_date">{t("invoices.date")}</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) =>
                      setFormData({ ...formData, invoice_date: e.target.value })
                    }
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
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyer_name">{t("invoices.buyerName")}</Label>
                  <Input
                    id="buyer_name"
                    value={formData.buyer_name}
                    onChange={(e) =>
                      setFormData({ ...formData, buyer_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyer_gstin">
                    {t("invoices.buyerGSTIN")}
                  </Label>
                  <Input
                    id="buyer_gstin"
                    value={formData.buyer_gstin}
                    onChange={(e) => handleBuyerGSTINChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="place_of_supply">
                    Place of Supply
                    <span className="text-xs text-slate-500 ml-2">
                      (auto-filled from GSTIN)
                    </span>
                  </Label>
                  <Select
                    value={formData.place_of_supply}
                    onValueChange={(value) =>
                      setFormData({ ...formData, place_of_supply: value })
                    }
                  >
                    <SelectTrigger id="place_of_supply">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <div className="grid gap-4 md:grid-cols-6">
                    <div className="space-y-2">
                      <Label>Select Item</Label>
                      <Select
                        onValueChange={(value) =>
                          handleItemSelect(index, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
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
                      <Label>HSN/SAC Code</Label>
                      <Input
                        placeholder="e.g. 1006"
                        value={lineItem.hsn_sac_code}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[index].hsn_sac_code = e.target.value;
                          setLineItems(updated);
                        }}
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
                        items.find((i) => i.id === lineItem.item_id),
                      )}
                    />
                  )}

                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                    >
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
                {totals.igst > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">IGST:</span>
                    <span>₹{totals.igst.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">CGST:</span>
                      <span>₹{totals.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">SGST:</span>
                      <span>₹{totals.sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {totals.igst > 0 && (
                  <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Interstate supply - IGST applicable
                  </p>
                )}
                {totals.cgst > 0 && (
                  <p className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    Intrastate supply - CGST + SGST applicable
                  </p>
                )}

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

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Updating..." : "Update Invoice"}
          </Button>
        </form>
      </div>
    </div>
  );
}
