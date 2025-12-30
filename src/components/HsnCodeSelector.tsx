import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HsnCode, searchHsnSemantic } from '@/components/HsnEmbeddings';
import { debounce } from 'lodash';

interface HsnCodeSelectorProps {
  value?: string;
  onSelect: (hsnCode: string, gstRate: number, description: string) => void;
}

export function HsnCodeSelector({ value, onSelect }: HsnCodeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [hsnCodes, setHsnCodes] = useState<HsnCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHsn = useMemo(
    () =>
      debounce(async (q: string) => {
        setLoading(true);
        const results = await searchHsnSemantic(q, 50);
        setHsnCodes(results);
        setLoading(false);
      }, 250),
    []
  );

  useEffect(() => {
    fetchHsn(searchQuery);
  }, [searchQuery]);

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
                ({selectedHsn.tax_rate}%)
              </span>
            </span>
          ) : (
            'Select HSN/SAC code...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search HSN code or description..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>{loading ? 'Loading...' : 'No HSN code found.'}</CommandEmpty>
            <CommandGroup>
              {hsnCodes.map((code) => (
                <CommandItem
                  key={code.id}
                  value={code.hsn_code}
                  onSelect={() => {
                    onSelect(code.hsn_code, code.tax_rate, code.name);
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
                        {code.tax_rate}%
                      </span>
                    </div>
                    {code.name && (
                      <span className="text-xs text-muted-foreground truncate">
                        {code.name}
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
