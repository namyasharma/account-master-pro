import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download } from "lucide-react";

export default function GSTR3BSummary() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { selectedBusiness } = useBusiness();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedBusiness) {
      navigate("/businesses");
      return;
    }
  }, [selectedBusiness]);

  const fetchSummary = async () => {
    if (!selectedBusiness) return;

    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const month = selectedMonth.toString().padStart(2, "0");
      const year = selectedYear.toString();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-gstr3b?business_id=${selectedBusiness.id}&month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch GSTR-3B summary");

      const data = await response.json();
      setSummary(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBusiness) {
      fetchSummary();
    }
  }, [selectedMonth, selectedYear, selectedBusiness]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate(-1)} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                GSTR-3B Summary
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Monthly summary return calculation
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label className="text-sm text-slate-600 mb-2 block">
                  Month
                </Label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(val) => setSelectedMonth(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, idx) => (
                      <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label className="text-sm text-slate-600 mb-2 block">
                  Year
                </Label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(val) => setSelectedYear(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: 5 },
                      (_, i) => new Date().getFullYear() - i,
                    ).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={fetchSummary} disabled={loading}>
                {loading ? "Calculating..." : "Calculate"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {summary && (
          <>
            {/* Outward Supplies */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">
                    3.1 Outward Supplies (Your Sales)
                  </span>
                  <span className="text-sm font-normal text-slate-600">
                    {summary.outwardSupplies.invoiceCount} invoices
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-600">Taxable Value</span>
                  <span className="font-semibold">
                    ₹{summary.outwardSupplies.taxableValue}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">CGST</span>
                  <span className="font-semibold">
                    ₹{summary.outwardSupplies.cgst}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">SGST</span>
                  <span className="font-semibold">
                    ₹{summary.outwardSupplies.sgst}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">IGST</span>
                  <span className="font-semibold">
                    ₹{summary.outwardSupplies.igst}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-slate-200 mt-2">
                  <span className="font-bold">Total Output Tax</span>
                  <span className="font-bold text-lg text-green-600">
                    ₹{summary.outwardSupplies.totalOutputTax}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Inward Supplies */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">
                    4. Input Tax Credit (Your Purchases)
                  </span>
                  <span className="text-sm font-normal text-slate-600">
                    {summary.inwardSupplies.purchaseCount} purchases
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-600">Taxable Value</span>
                  <span className="font-semibold">
                    ₹{summary.inwardSupplies.taxableValue}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-slate-200 mt-2">
                  <span className="font-bold">Total Input Tax (ITC)</span>
                  <span className="font-bold text-lg text-blue-600">
                    ₹{summary.inwardSupplies.totalInputTax}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Net Liability */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader className="border-b border-purple-200">
                <CardTitle className="text-lg">5. Net Tax Liability</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between py-2">
                  <span className="text-slate-700">Output Tax</span>
                  <span className="font-semibold">
                    ₹{summary.netTaxLiability.outputTax}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-700">Less: Input Tax (ITC)</span>
                  <span className="font-semibold">
                    - ₹{summary.netTaxLiability.inputTax}
                  </span>
                </div>
                <div className="h-px bg-slate-300 my-2"></div>
                <div className="flex justify-between py-4 bg-white rounded-lg px-4 shadow-sm">
                  <span className="font-bold text-lg">
                    {summary.netTaxLiability.status === "payable"
                      ? "Tax Payable"
                      : "Refundable"}
                  </span>
                  <span
                    className={`font-bold text-2xl ${
                      summary.netTaxLiability.status === "payable"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    ₹{summary.netTaxLiability.netPayable}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="border-0 shadow-lg bg-amber-50">
              <CardContent className="p-6">
                <h3 className="font-bold text-amber-900 mb-3">
                  📋 Next Steps:
                </h3>
                <ol className="space-y-2 text-sm text-amber-800">
                  <li>1. Note down these figures</li>
                  <li>2. Login to GST Portal (https://www.gst.gov.in)</li>
                  <li>3. Go to Services → Returns → GSTR-3B</li>
                  <li>4. Enter these values in the respective sections</li>
                  <li>5. Verify and submit your return</li>
                </ol>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
