import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function PublicInvoiceView() {
  const { token } = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      fetchInvoice();
    }
  }, [token]);

  const fetchInvoice = async () => {
    try {
      if (!token) {
        setError("Invalid invoice link");
        setLoading(false);
        return;
      }
      // First fetch invoice
      const { data: invoiceData, error: invoiceError } = (await supabase
        .from("invoices")
        .select("*")
        .eq("share_token", token as string)
        .single()) as any;

      if (invoiceError || !invoiceData) {
        setError("Invoice not found");
        return;
      }

      // Then fetch business separately
      const { data: businessData } = (await supabase
        .from("businesses")
        .select("name, gstin, address, phone, email")
        .eq("id", invoiceData.business_id)
        .single()) as any;

      // Then fetch line items
      const { data: items } = await supabase
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", invoiceData.id);

      setInvoice({ ...invoiceData, businesses: businessData });
      setLineItems(items || []);
    } catch (e) {
      setError("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  if (!invoice)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Invoice not found
      </div>
    );

  const isInterstate = Number(invoice.igst_amount) > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 text-white p-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">
              {invoice.businesses?.name || "N/A"}
            </h1>
            {invoice.businesses?.gstin && (
              <p className="text-slate-300 text-sm mt-1">
                GSTIN: {invoice.businesses.gstin}
              </p>
            )}
            {invoice.businesses?.address && (
              <p className="text-slate-300 text-sm">
                {invoice.businesses.address}
              </p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold tracking-widest">TAX INVOICE</h2>
            <p className="text-slate-300 text-sm mt-1">
              #{invoice.invoice_number}
            </p>
            <p className="text-slate-300 text-sm">
              {new Date(invoice.invoice_date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Buyer Details */}
        <div className="p-6 border-b">
          <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-2">
            Billed To
          </h3>
          <p className="font-bold text-lg">{invoice.buyer_name}</p>
          {invoice.buyer_gstin && (
            <p className="text-sm text-slate-600 font-mono">
              GSTIN: {invoice.buyer_gstin}
            </p>
          )}
        </div>

        {/* Line Items */}
        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-2 text-slate-600">#</th>
                <th className="text-left py-2 text-slate-600">Description</th>
                <th className="text-left py-2 text-slate-600">HSN</th>
                <th className="text-right py-2 text-slate-600">Qty</th>
                <th className="text-right py-2 text-slate-600">Rate</th>
                <th className="text-right py-2 text-slate-600">GST</th>
                <th className="text-right py-2 text-slate-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-3 text-slate-500">{i + 1}</td>
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 font-mono text-slate-500">
                    {item.hsn_sac_code || "-"}
                  </td>
                  <td className="py-3 text-right">{item.quantity}</td>
                  <td className="py-3 text-right">
                    ₹{Number(item.unit_price).toFixed(2)}
                  </td>
                  <td className="py-3 text-right">{item.gst_rate}%</td>
                  <td className="py-3 text-right font-medium">
                    ₹
                    {(
                      Number(item.line_total) + Number(item.gst_amount)
                    ).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-6 bg-slate-50 border-t">
          <div className="max-w-xs ml-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span>₹{Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            {isInterstate ? (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">IGST</span>
                <span>₹{Number(invoice.igst_amount).toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">CGST</span>
                  <span>₹{Number(invoice.cgst_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">SGST</span>
                  <span>₹{Number(invoice.sgst_amount).toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span>₹{Number(invoice.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-slate-400 text-xs border-t">
          This is a computer generated invoice. Powered by GSTinator.
        </div>
      </div>
    </div>
  );
}
