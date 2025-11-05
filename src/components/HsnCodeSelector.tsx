import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HsnCode {
  id: string;
  hsn_code: string;
  description: string;
  gst_rate: number;
}

interface HsnCodeSelectorProps {
  value?: string;
  onSelect: (hsnCode: string, gstRate: number, description: string) => void;
}

export function HsnCodeSelector({ value, onSelect }: HsnCodeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [hsnCodes, setHsnCodes] = useState<HsnCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHsnCodes();
  }, [searchQuery]);

  const fetchHsnCodes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('hsn_codes')
        .select('*')
        .order('hsn_code', { ascending: true })
        .limit(50);

      if (searchQuery) {
        query = query.or(`hsn_code.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHsnCodes(data || []);
    } catch (error) {
      console.error('Error fetching HSN codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedHsn = hsnCodes.find((code) => code.hsn_code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedHsn ? (
            <span className="flex items-center gap-2">
              <span className="font-medium">{selectedHsn.hsn_code}</span>
              <span className="text-muted-foreground text-sm">
                ({selectedHsn.gst_rate}%)
              </span>
            </span>
          ) : (
            'Select HSN/SAC code...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search HSN code or description..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? 'Loading...' : 'No HSN code found.'}
            </CommandEmpty>
            <CommandGroup>
              {hsnCodes.map((code) => (
                <CommandItem
                  key={code.id}
                  value={code.hsn_code}
                  onSelect={() => {
                    onSelect(code.hsn_code, code.gst_rate, code.description);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === code.hsn_code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{code.hsn_code}</span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {code.gst_rate}%
                      </span>
                    </div>
                    {code.description && (
                      <span className="text-xs text-muted-foreground truncate">
                        {code.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}