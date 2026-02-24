import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useBusiness } from "@/contexts/BusinessContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
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
import { validateGstRate, ValidationWarning } from "@/lib/gstValidation";
import { logWorkflowShortcut } from "@/lib/telemetry";
import { purchaseSchema } from "@/lib/validation";

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

export default function CreatePurchase() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    entry_number: "",
    entry_date: new Date().toISOString().split("T")[0],
    supplier_id: "",
    supplier_name: "",
    supplier_gstin: "",
    place_of_supply: "",
    subtotal: "",
    gst_amount: "",
  });
  const { selectedBusiness } = useBusiness();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const isEditMode = !!id;

  const fetchPurchaseById = async (purchaseId: string) => {
    try {
      const { data, error } = await supabase
        .from("purchase_entries")
        .select("*")
        .eq("id", purchaseId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          entry_number: data.entry_number,
          entry_date: data.entry_date,
          supplier_id: data.supplier_id || "",
          supplier_name: data.supplier_name,
          supplier_gstin: data.supplier_gstin || "",
          place_of_supply: data.place_of_supply || "",
          subtotal: String(data.subtotal),
          gst_amount: String(data.gst_amount),
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load purchase",
        variant: "destructive",
      });
      navigate("/purchases");
    }
  };

  useEffect(() => {
    if (!selectedBusiness) {
      navigate("/businesses");
      return;
    }

    fetchSuppliers();
    if (isEditMode && id) {
      fetchPurchaseById(id);
    }

    // Handle prefill from workflow shortcuts
    const prefillItemId = searchParams.get("prefillItemId");
    const prefillSupplierId = searchParams.get("prefillSupplierId");

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
        .from("suppliers")
        .select("*")
        .eq("business_id", selectedBusiness?.id)
        .order("name");

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      console.error("Failed to fetch suppliers:", error);
    }
  };

  const fetchAndPrefillSupplier = async (supplierId: string) => {
    try {
      const { data: supplier, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", supplierId)
        .single();

      if (error) throw error;

      if (supplier) {
        setFormData((prev) => ({
          ...prev,
          supplier_id: supplier.id,
          supplier_name: supplier.name,
          supplier_gstin: supplier.gstin || "",
        }));

        if (user?.id && selectedBusiness?.id) {
          logWorkflowShortcut({
            event_name: "workflow_shortcut_used",
            user_id: user.id,
            business_id: selectedBusiness.id,
            shortcut_type: "supplier_to_purchase",
            metadata: { supplier_id: supplierId },
          });
        }

        toast({
          title: "Supplier prefilled",
          description: `Pre-filled with ${supplier.name}`,
        });
      }
    } catch (error: any) {
      console.error("Failed to prefill supplier:", error);
    }
  };

  const fetchAndPrefillItem = async (itemId: string) => {
    try {
      const { data: item, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", itemId)
        .single();

      if (error) throw error;

      if (item) {
        // Prefill form with item data
        setFormData((prev) => ({
          ...prev,
          subtotal: String(item.unit_price),
          gst_amount: String((item.unit_price * item.gst_rate) / 100),
        }));

        // Log telemetry
        if (user?.id && selectedBusiness?.id) {
          logWorkflowShortcut({
            event_name: "workflow_shortcut_used",
            user_id: user.id,
            business_id: selectedBusiness.id,
            shortcut_type: "item_to_purchase",
            metadata: { item_id: itemId },
          });
        }

        toast({
          title: "Item prefilled",
          description: `Pre-filled with data from ${item.name}`,
        });
      }
    } catch (error: any) {
      console.error("Failed to prefill item:", error);
    }
  };

  const calculateGSTSplit = (gstAmount: number) => {
    const sellerStateCode = selectedBusiness?.state_code;
    const supplierStateCode = formData.supplier_gstin?.substring(0, 2);
    const posStateCode = formData.place_of_supply;

    const effectiveSupplierState = supplierStateCode || posStateCode;

    if (!effectiveSupplierState || !sellerStateCode) {
      return { cgst: gstAmount / 2, sgst: gstAmount / 2, igst: 0 };
    }

    if (effectiveSupplierState === sellerStateCode) {
      return { cgst: gstAmount / 2, sgst: gstAmount / 2, igst: 0 };
    } else {
      return { cgst: 0, sgst: 0, igst: gstAmount };
    }
  };

  const calculateTotal = () => {
    const subtotal = Number(formData.subtotal) || 0;
    const gstAmount = Number(formData.gst_amount) || 0;
    const gstSplit = calculateGSTSplit(gstAmount);

    return {
      total: subtotal + gstAmount,
      cgst: gstSplit.cgst,
      sgst: gstSplit.sgst,
      igst: gstSplit.igst,
    };
  };

  const handleSupplierGSTINChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      supplier_gstin: value,
      place_of_supply:
        value.length >= 2 ? value.substring(0, 2) : prev.place_of_supply,
    }));
  };

  const getValidationWarnings = (): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];

    const subtotal = Number(formData.subtotal) || 0;
    const gstAmount = Number(formData.gst_amount) || 0;

    // Check if GST is zero when subtotal is not
    if (gstAmount === 0 && subtotal > 0) {
      warnings.push({
        type: "zero_gst_taxable",
        message:
          "GST amount is zero but purchase has a subtotal - this may indicate a taxable purchase",
        severity: "error",
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
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (supplier) {
      setFormData({
        ...formData,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        supplier_gstin: supplier.gstin || "",
        place_of_supply:
          supplier.gstin.length >= 2 ? supplier.gstin.substring(0, 2) : "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate business is selected
      if (!selectedBusiness?.id) {
        toast({
          title: "Validation Error",
          description:
            "Please select a business before creating a purchase entry",
          variant: "destructive",
        });
        return;
      }

      // Validate purchase data
      const validationResult = purchaseSchema.safeParse({
        entry_number: formData.entry_number,
        entry_date: formData.entry_date,
        supplier_name: formData.supplier_name,
        supplier_gstin: formData.supplier_gstin,
        subtotal: Number(formData.subtotal),
        gst_amount: Number(formData.gst_amount),
        total: calculateTotal().total,
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

      const totals = calculateTotal();

      let error;

      if (isEditMode && id) {
        const response = await supabase
          .from("purchase_entries")
          .update({
            entry_number: formData.entry_number,
            entry_date: formData.entry_date,
            supplier_id: formData.supplier_id || null,
            supplier_name: formData.supplier_name,
            supplier_gstin: formData.supplier_gstin,
            place_of_supply: formData.place_of_supply || null,
            subtotal: Number(formData.subtotal),
            gst_amount: Number(formData.gst_amount),
            cgst_amount: totals.cgst,
            sgst_amount: totals.sgst,
            igst_amount: totals.igst,
            total: totals.total,
          })
          .eq("id", id);

        error = response.error;
      } else {
        const response = await supabase.from("purchase_entries").insert({
          business_id: selectedBusiness.id,
          entry_number: formData.entry_number,
          entry_date: formData.entry_date,
          supplier_id: formData.supplier_id || null,
          supplier_name: formData.supplier_name,
          supplier_gstin: formData.supplier_gstin,
          place_of_supply: formData.place_of_supply || null,
          subtotal: Number(formData.subtotal),
          gst_amount: Number(formData.gst_amount),
          cgst_amount: totals.cgst,
          sgst_amount: totals.sgst,
          igst_amount: totals.igst,
          total: totals.total,
        });

        error = response.error;
      }

      if (error) {
        // Handle specific database errors
        if (
          error.code === "23505" &&
          error.message.includes(
            "purchase_entries_business_id_entry_number_key",
          )
        ) {
          throw new Error(
            `Entry number "${formData.entry_number}" already exists for this business. Please use a unique entry number.`,
          );
        }
        if (error.code === "23503") {
          throw new Error(
            "Invalid business or supplier reference. Please refresh and try again.",
          );
        }
        throw error;
      }

      toast({
        title: "Success",
        description: isEditMode
          ? "Purchase entry updated successfully"
          : "Purchase entry created successfully",
      });

      navigate("/purchases");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create purchase entry",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-responsive space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="font-bold">{t("purchases.add")}</h1>
        <Button
          onClick={() => navigate("/purchases")}
          size="sm"
          variant="outline"
          className="border-primary/30 hover:bg-primary/10"
        >
          Back
        </Button>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Entry Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="entry_number">
                    {t("purchases.entryNumber")}
                  </Label>
                  <Input
                    id="entry_number"
                    value={formData.entry_number}
                    onChange={(e) =>
                      setFormData({ ...formData, entry_number: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entry_date">Date</Label>
                  <Input
                    id="entry_date"
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) =>
                      setFormData({ ...formData, entry_date: e.target.value })
                    }
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
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_name">
                    {t("purchases.supplierName")}
                  </Label>
                  <Input
                    id="supplier_name"
                    value={formData.supplier_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supplier_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_gstin">
                    {t("purchases.supplierGSTIN")}
                  </Label>
                  <Input
                    id="supplier_gstin"
                    value={formData.supplier_gstin}
                    onChange={(e) => handleSupplierGSTINChange(e.target.value)}
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
                <div className="space-y-2">
                  <Label htmlFor="subtotal">Subtotal</Label>
                  <Input
                    id="subtotal"
                    type="number"
                    step="0.01"
                    value={formData.subtotal}
                    onChange={(e) =>
                      setFormData({ ...formData, subtotal: e.target.value })
                    }
                    required
                  />
                </div>
                {calculateTotal().igst > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">IGST:</span>
                    <span>₹{calculateTotal().igst.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">CGST:</span>
                      <span>₹{calculateTotal().cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">SGST:</span>
                      <span>₹{calculateTotal().sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}

                {calculateTotal().igst > 0 && (
                  <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Interstate supply - IGST applicable
                  </p>
                )}
                {calculateTotal().cgst > 0 && (
                  <p className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    Intrastate supply - CGST + SGST applicable
                  </p>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>₹{calculateTotal().total.toFixed(2)}</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst_amount">GST Amount</Label>
                  <Input
                    id="gst_amount"
                    type="number"
                    step="0.01"
                    value={formData.gst_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, gst_amount: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>₹{calculateTotal().total.toFixed(2)}</span>
                </div>
              </div>

              {/* Validation Warnings */}
              <ValidationWarningBadge warnings={getValidationWarnings()} />

              <Button type="submit" className="w-full">
                {t("common.save")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
