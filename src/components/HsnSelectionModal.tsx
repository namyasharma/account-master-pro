import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Search, AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HsnCode {
    id: string;
    hsn_code: string;
    name: string | null;
    description: string | null;
    gst_rate: number;
    rate_type: 'flat' | 'tiered' | 'reverse_charge' | null;
    threshold_amount: number | null;
    rate_below_threshold: number | null;
    rate_above_threshold: number | null;
}

interface HsnSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemName: string;
    onSelect: (hsn: HsnCode) => void;
    onSkip: () => void;
}

export function HsnSelectionModal({
    open,
    onOpenChange,
    itemName,
    onSelect,
    onSkip,
}: HsnSelectionModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [hsnCode, setHsnCode] = useState<HsnCode[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Debounced search
    const fetchHsnCodes = useCallback(async (query: string) => {
        setLoading(true);
        try {
            // Build search query - fuzzy matching on name and description
            let supabaseQuery = supabase
                .from('hsn_code')
                .select('id, hsn_code, name, description, gst_rate, rate_type, threshold_amount, rate_below_threshold, rate_above_threshold')
                .order('hsn_code', { ascending: true })
                .limit(15);

            if (query.trim()) {
                // Search across name, description, and hsn_code
                const searchTerms = query.trim().toLowerCase().split(/\s+/);
                const orConditions = searchTerms.map(term =>
                    `name.ilike.%${term}%,description.ilike.%${term}%,hsn_code.ilike.%${term}%`
                ).join(',');

                supabaseQuery = supabaseQuery.or(orConditions);
            }

            const { data, error } = await supabaseQuery;

            if (error) throw error;

            // Sort by relevance - exact matches first, then partial matches
            const sortedData = (data || []).sort((a, b) => {
                const queryLower = query.toLowerCase();
                const aName = (a.name || '').toLowerCase();
                const bName = (b.name || '').toLowerCase();

                // Exact match gets highest priority
                if (aName === queryLower && bName !== queryLower) return -1;
                if (bName === queryLower && aName !== queryLower) return 1;

                // Starts with query gets next priority
                if (aName.startsWith(queryLower) && !bName.startsWith(queryLower)) return -1;
                if (bName.startsWith(queryLower) && !aName.startsWith(queryLower)) return 1;

                // Contains query word
                if (aName.includes(queryLower) && !bName.includes(queryLower)) return -1;
                if (bName.includes(queryLower) && !aName.includes(queryLower)) return 1;

                return 0;
            });

            setHsnCode(sortedData as unknown as HsnCode[]);
        } catch (error) {
            console.error('Error fetching HSN codes:', error);
            setHsnCode([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchHsnCodes(searchQuery || itemName);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, itemName, fetchHsnCodes]);

    // Initialize search with item name when modal opens
    useEffect(() => {
        if (open) {
            setSearchQuery('');
            setSelectedId(null);
            fetchHsnCodes(itemName);
        }
    }, [open, itemName, fetchHsnCodes]);

    const handleRowClick = (hsn: HsnCode) => {
        setSelectedId(hsn.id);
    };

    const handleConfirmSelection = () => {
        const selected = hsnCode.find(h => h.id === selectedId);
        if (selected) {
            onSelect(selected);
            onOpenChange(false);
        }
    };

    const handleSkip = () => {
        onSkip();
        onOpenChange(false);
    };

    const getRateTypeBadge = (rateType: string | null) => {
        switch (rateType) {
            case 'tiered':
                return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Tiered rate</Badge>;
            case 'reverse_charge':
                return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Reverse charge</Badge>;
            default:
                return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Flat rate</Badge>;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && selectedId) {
            handleConfirmSelection();
        } else if (e.key === 'Escape') {
            handleSkip();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-4xl max-h-[85vh] flex flex-col"
                onKeyDown={handleKeyDown}
            >
                <DialogHeader>
                    <DialogTitle>Find HSN/SAC Code</DialogTitle>
                    <DialogDescription>
                        Search and select the appropriate HSN/SAC code for "{itemName}"
                    </DialogDescription>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by item name, HSN code, or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        autoFocus
                    />
                </div>

                <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead className="w-[30%]">Item Name</TableHead>
                                <TableHead className="w-[15%]">HSN Code</TableHead>
                                <TableHead className="w-[15%]">GST Rate</TableHead>
                                <TableHead className="w-[20%]">Rate Type</TableHead>
                                <TableHead className="w-[20%]">Tiered Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Searching...
                                    </TableCell>
                                </TableRow>
                            ) : hsnCode.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No HSN codes found. Try a different search term or add as custom item.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                hsnCode.map((hsn) => (
                                    <TableRow
                                        key={hsn.id}
                                        className={cn(
                                            'cursor-pointer transition-colors',
                                            selectedId === hsn.id
                                                ? 'bg-primary/10 hover:bg-primary/15'
                                                : 'hover:bg-muted/50'
                                        )}
                                        onClick={() => handleRowClick(hsn)}
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleRowClick(hsn);
                                            }
                                        }}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {selectedId === hsn.id && (
                                                    <Check className="h-4 w-4 text-primary shrink-0" />
                                                )}
                                                <span className="line-clamp-2">{hsn.name || hsn.description || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{hsn.hsn_code}</TableCell>
                                        <TableCell>
                                            <span className="font-semibold">{hsn.gst_rate}%</span>
                                        </TableCell>
                                        <TableCell>{getRateTypeBadge(hsn.rate_type)}</TableCell>
                                        <TableCell>
                                            {hsn.rate_type === 'tiered' && hsn.threshold_amount ? (
                                                <div className="text-xs space-y-0.5">
                                                    <div>Threshold: ₹{hsn.threshold_amount.toLocaleString()}</div>
                                                    <div>Below: {hsn.rate_below_threshold}%</div>
                                                    <div>Above: {hsn.rate_above_threshold}%</div>
                                                </div>
                                            ) : hsn.rate_type === 'reverse_charge' ? (
                                                <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    <span>Reverse charge applicable</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>

                <div className="flex justify-between items-center pt-4 border-t">
                    <Button variant="ghost" onClick={handleSkip}>
                        Skip and add custom item
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmSelection}
                            disabled={!selectedId}
                        >
                            Select HSN Code
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}