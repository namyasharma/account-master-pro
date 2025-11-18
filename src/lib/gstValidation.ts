// GST validation utilities
export const VALID_GST_RATES = [0, 5, 12, 18, 28];

export interface ValidationWarning {
  type: 'invalid_rate' | 'hsn_mismatch' | 'missing_hsn' | 'zero_gst_taxable';
  message: string;
  severity: 'warning' | 'error';
}

export function validateGstRate(rate: number): ValidationWarning | null {
  if (!VALID_GST_RATES.includes(rate)) {
    return {
      type: 'invalid_rate',
      message: `GST rate ${rate}% is not standard (0, 5, 12, 18, or 28%)`,
      severity: 'warning',
    };
  }
  return null;
}

export function validateHsnGstMatch(
  userGstRate: number,
  hsnGstRate: number | null
): ValidationWarning | null {
  if (hsnGstRate !== null && Math.abs(userGstRate - hsnGstRate) > 0.01) {
    return {
      type: 'hsn_mismatch',
      message: `GST rate ${userGstRate}% does not match HSN rate ${hsnGstRate}%`,
      severity: 'error',
    };
  }
  return null;
}

export function validateMissingHsn(hsnCode: string | null): ValidationWarning | null {
  if (!hsnCode || hsnCode.trim() === '') {
    return {
      type: 'missing_hsn',
      message: 'HSN/SAC code is missing',
      severity: 'warning',
    };
  }
  return null;
}

export function validateZeroGstTaxable(
  gstRate: number,
  hsnGstRate: number | null
): ValidationWarning | null {
  if (gstRate === 0 && hsnGstRate !== null && hsnGstRate > 0) {
    return {
      type: 'zero_gst_taxable',
      message: `GST is 0% but HSN indicates taxable item (${hsnGstRate}%)`,
      severity: 'error',
    };
  }
  return null;
}
