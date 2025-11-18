import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ValidationWarning } from '@/lib/gstValidation';

interface ValidationWarningBadgeProps {
  warnings: ValidationWarning[];
}

export function ValidationWarningBadge({ warnings }: ValidationWarningBadgeProps) {
  if (warnings.length === 0) return null;

  const hasError = warnings.some(w => w.severity === 'error');

  return (
    <div className="space-y-2">
      {warnings.map((warning, idx) => (
        <div key={idx} className="flex items-start gap-2">
          {warning.severity === 'error' ? (
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          )}
          <span className={`text-sm ${warning.severity === 'error' ? 'text-destructive' : 'text-yellow-600 dark:text-yellow-500'}`}>
            {warning.message}
          </span>
        </div>
      ))}
      {hasError && (
        <Badge variant="destructive" className="mt-2">
          Needs Review
        </Badge>
      )}
    </div>
  );
}
