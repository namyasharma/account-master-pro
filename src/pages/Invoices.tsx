import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBusiness } from "@/contexts/BusinessContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Calendar,
  DollarSign,
  Download,
  FileText,
  MoreVertical,
  Plus,
  TrendingUp,
  User,
} from "lucide-react";

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingGSTR1, setExportingGSTR1] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { selectedBusiness } = useBusiness();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedBusiness) {
      navigate("/businesses");
      return;
    }
    fetchInvoices();
  }, [selectedBusiness]);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
        *,
        customers:customer_id (phone)
      `,
        )
        .eq("business_id", selectedBusiness?.id)
        .order("invoice_date", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
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

  const handleExportCSV = async () => {
    if (!selectedBusiness) return;

    setExporting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-invoice-csv?business_id=${selectedBusiness.id}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoices-${selectedBusiness.name}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Invoice data exported to CSV",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Could not export invoices",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportGSTR1 = async () => {
    if (!selectedBusiness) return;

    setExportingGSTR1(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Get current month and year
      const now = new Date();
      const month = selectedMonth.toString().padStart(2, "0");
      const year = selectedYear.toString();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-gstr1?business_id=${selectedBusiness.id}&month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GSTR1_B2B_${selectedBusiness.name}_${month}-${year}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "GSTR-1 Export Successful",
        description: "B2B invoices exported in GST portal format",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Could not export GSTR-1 data",
        variant: "destructive",
      });
    } finally {
      setExportingGSTR1(false);
    }
  };

  const handleExportPDF = async (invoiceId: string) => {
    setExporting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-invoice-pdf?invoice_id=${invoiceId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Export failed");

      const html = await response.text();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }

      toast({
        title: "PDF ready",
        description: "Invoice opened in new window for printing",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Could not generate PDF",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  const shareOnWhatsApp = (invoice: any) => {
    const phone = invoice.customers?.phone?.replace(/\D/g, "");

    // Use your app's domain + share token - no auth needed
    // const shareUrl = `${window.location.origin}/invoice/view/${invoice.share_token}`;
    const shareUrl = "https://google.com"; // --- IGNORE ---

    const message =
      `Hello ${invoice.buyer_name},\n\n` +
      `Please find your invoice details below:\n` +
      `Invoice No: ${invoice.invoice_number}\n` +
      `Date: ${new Date(invoice.invoice_date).toLocaleDateString("en-IN")}\n` +
      `Amount: ₹${Number(invoice.total).toFixed(2)}\n\n` +
      `${shareUrl}\n\n` +
      `Thank you for your business!\n` +
      `Sent via GSTinator`;

    if (phone) {
      window.open(
        `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`,
        "_blank",
      );
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        "_blank",
      );
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              {t("invoices.title")}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage and track all your invoices
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap items-end">
            {/* Date Range Selector for GSTR-1 */}
            <div className="flex gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Month</Label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(val) => setSelectedMonth(parseInt(val))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">January</SelectItem>
                    <SelectItem value="2">February</SelectItem>
                    <SelectItem value="3">March</SelectItem>
                    <SelectItem value="4">April</SelectItem>
                    <SelectItem value="5">May</SelectItem>
                    <SelectItem value="6">June</SelectItem>
                    <SelectItem value="7">July</SelectItem>
                    <SelectItem value="8">August</SelectItem>
                    <SelectItem value="9">September</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Year</Label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(val) => setSelectedYear(parseInt(val))}
                >
                  <SelectTrigger className="w-28">
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
            </div>

            <Button
              onClick={handleExportCSV}
              variant="outline"
              disabled={exporting || invoices.length === 0}
              className="border-slate-200 hover:bg-slate-50 shadow-sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              onClick={handleExportGSTR1}
              variant="outline"
              disabled={exportingGSTR1 || invoices.length === 0}
              className="border-green-200 hover:bg-green-50 shadow-sm text-green-700 hover:text-green-800"
            >
              <FileText className="mr-2 h-4 w-4" />
              {exportingGSTR1 ? "Exporting..." : "GSTR-1 Export"}
            </Button>
            <Link to="/invoices/create">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/30">
                <Plus className="mr-2 h-4 w-4" />
                {t("invoices.create")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  Total Invoices
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  {invoices.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  ₹
                  {invoices
                    .reduce((sum, inv) => sum + Number(inv.total), 0)
                    .toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total GST</p>
                <p className="text-2xl font-bold text-slate-800">
                  ₹
                  {invoices
                    .reduce((sum, inv) => sum + Number(inv.gst_amount), 0)
                    .toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Grid */}
        {invoices.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                No invoices yet
              </h3>
              <p className="text-slate-500 mb-6">
                Create your first invoice to get started
              </p>
              <Link to="/invoices/create">
                <Button className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/30">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:gap-5 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {invoices.map((invoice) => (
              <Card
                key={invoice.id}
                className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white"
              >
                {/* Gradient accent on hover */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                <CardContent className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">
                            {invoice.invoice_number}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(invoice.invoice_date).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Amount Badge */}
                    <div className="text-right">
                      <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        ₹{Number(invoice.total).toFixed(2)}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        GST: ₹{Number(invoice.gst_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                  {/* Customer Info */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">
                          {invoice.buyer_name}
                        </p>
                        {invoice.buyer_gstin && (
                          <p className="text-xs text-slate-500 font-mono">
                            {invoice.buyer_gstin}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleExportPDF(invoice.id)}
                      variant="outline"
                      size="sm"
                      disabled={exporting}
                      className="flex-1 border-slate-200 hover:bg-slate-50 hover:border-purple-300 hover:text-purple-600 transition-colors group"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                    <Button
                      onClick={() => shareOnWhatsApp(invoice)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-slate-200 hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-colors"
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Share
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3 border-slate-200 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Status Badge (Optional - you can add status field to invoices) */}
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                      Paid
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
