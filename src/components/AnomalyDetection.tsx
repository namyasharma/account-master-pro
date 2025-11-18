import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { VALID_GST_RATES } from '@/lib/gstValidation';

interface Anomaly {
  id: string;
  type: 'invoice_hsn_mismatch' | 'purchase_zero_gst' | 'missing_hsn' | 'invalid_rate';
  severity: 'warning' | 'error';
  message: string;
  reference: string;
}

interface AnomalyDetectionProps {
  businessId: string;
}

export function AnomalyDetection({ businessId }: AnomalyDetectionProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectAnomalies();
  }, [businessId]);

  const detectAnomalies = async () => {
    try {
      const detected: Anomaly[] = [];

      // Check invoice line items for HSN mismatches
      const { data: invoiceItems, error: invoiceError } = await supabase
        .from('invoice_line_items')
        .select('id, description, gst_rate, item_id, invoice_id, items(hsn_sac_code, gst_rate)')
        .limit(100);

      if (invoiceError) throw invoiceError;

      invoiceItems?.forEach(item => {
        const itemData = item.items as any;
        
        // Check for invalid GST rate
        if (!VALID_GST_RATES.includes(item.gst_rate)) {
          detected.push({
            id: `inv-rate-${item.id}`,
            type: 'invalid_rate',
            severity: 'warning',
            message: `Invalid GST rate ${item.gst_rate}% on invoice item "${item.description}"`,
            reference: `Invoice item`,
          });
        }

        // Check for HSN mismatch if item exists
        if (itemData && Math.abs(item.gst_rate - itemData.gst_rate) > 0.01) {
          detected.push({
            id: `inv-hsn-${item.id}`,
            type: 'invoice_hsn_mismatch',
            severity: 'error',
            message: `GST rate mismatch: "${item.description}" has ${item.gst_rate}% but HSN indicates ${itemData.gst_rate}%`,
            reference: `Invoice item`,
          });
        }

        // Check for missing HSN
        if (!itemData || !itemData.hsn_sac_code) {
          detected.push({
            id: `inv-missing-${item.id}`,
            type: 'missing_hsn',
            severity: 'warning',
            message: `Missing HSN code for invoice item "${item.description}"`,
            reference: `Invoice item`,
          });
        }
      });

      // Check items for missing HSN codes and rate issues
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('id, name, hsn_sac_code, gst_rate')
        .eq('business_id', businessId)
        .limit(100);

      if (itemsError) throw itemsError;

      items?.forEach(item => {
        if (!item.hsn_sac_code) {
          detected.push({
            id: `item-hsn-${item.id}`,
            type: 'missing_hsn',
            severity: 'warning',
            message: `Item "${item.name}" is missing HSN/SAC code`,
            reference: 'Items',
          });
        }

        if (!VALID_GST_RATES.includes(item.gst_rate)) {
          detected.push({
            id: `item-rate-${item.id}`,
            type: 'invalid_rate',
            severity: 'warning',
            message: `Item "${item.name}" has non-standard GST rate ${item.gst_rate}%`,
            reference: 'Items',
          });
        }
      });

      // Check purchases for zero GST on taxable items
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchase_entries')
        .select('id, entry_number, gst_amount, subtotal')
        .eq('business_id', businessId)
        .limit(100);

      if (purchaseError) throw purchaseError;

      purchases?.forEach(purchase => {
        if (purchase.gst_amount === 0 && purchase.subtotal > 0) {
          detected.push({
            id: `purch-zero-${purchase.id}`,
            type: 'purchase_zero_gst',
            severity: 'error',
            message: `Purchase "${purchase.entry_number}" has zero GST but non-zero subtotal`,
            reference: 'Purchases',
          });
        }
      });

      setAnomalies(detected);
    } catch (error) {
      console.error('Error detecting anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Anomaly Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Scanning for issues...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Anomaly Detection
        </CardTitle>
      </CardHeader>
      <CardContent>
        {anomalies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No anomalies detected. All entries look good!</p>
        ) : (
          <div className="space-y-2">
            {anomalies.slice(0, 10).map(anomaly => (
              <Alert key={anomaly.id} variant={anomaly.severity === 'error' ? 'destructive' : 'default'}>
                <div className="flex items-start gap-2">
                  {anomaly.severity === 'error' ? (
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500" />
                  )}
                  <div className="flex-1">
                    <AlertDescription className="text-sm">
                      <span className="font-medium">{anomaly.reference}:</span> {anomaly.message}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
            {anomalies.length > 10 && (
              <p className="text-sm text-muted-foreground mt-2">
                +{anomalies.length - 10} more issues found
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
