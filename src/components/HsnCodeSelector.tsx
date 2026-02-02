import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { debounce } from "lodash";
import { supabase } from "@/integrations/supabase/client";

interface HsnCodeWithRate {
  id: string;
  hsn_code: string;
  name: string;
  type: "HSN" | "SAC";
  // Dynamic rates from get_current_gst_rate()
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cess_rate: number;
  is_exempt: boolean;
  rate_source: string; // 'override', 'rule', 'hsn_code', 'default'
}

interface HsnCodeSelectorProps {
  value?: string;
  onSelect: (
    hsnCode: string,
    rates: {
      cgst: number;
      sgst: number;
      igst: number;
      cess: number;
      is_exempt: boolean;
    },
    description: string,
  ) => void;
  transactionDate?: string; // For getting rates as of a specific date
  placeholder?: string;
}

export function HsnCodeSelector({
  value,
  onSelect,
  transactionDate,
  placeholder = "Select HSN/SAC code...",
}: HsnCodeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [hsnCodes, setHsnCodes] = useState<HsnCodeWithRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = searchQuery.padEnd(8, "0");
  const fetchHsnWithRates = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query || query.length < 2) {
          setHsnCodes([]);
          return;
        }

        setLoading(true);

        try {
          // Step 1: Search HSN/SAC codes using semantic search or text search
          const { data: hsnData, error: hsnError } = await supabase.rpc(
            "search_hsn_sac_codes",
            {
              search_query: query,
              limit_count: 50,
            },
          );

          if (hsnError) throw hsnError;

          if (!hsnData || hsnData.length === 0) {
            setHsnCodes([]);
            setLoading(false);
            console.log("No HSN data found for query:", query);
            return;
          }
          // console.log(
          //   `Found ${hsnData.length} HSN/SAC codes for query:`,
          //   query,
          // );
          // console.log("HSN Data Sample:", hsnData.slice(0, 3));
          // Step 2: Get current GST rates for each code

          const codesWithRates: HsnCodeWithRate[] = await Promise.all(
            hsnData.map(async (hsn: any) => {
              const hsn4 = hsn.code.slice(0, 4);
              console.log("Fetching rate for HSN4 code:", hsn4);
              const { data: rateData } = await supabase.rpc(
                "get_current_gst_rate",
                {
                  p_hsn_sac_code: hsn4,
                  p_transaction_date:
                    transactionDate || new Date().toISOString().split("T")[0],
                },
              );

              const rate = rateData?.[0] || {
                cgst_rate: 9,
                sgst_rate: 9,
                igst_rate: 18,
                cess_rate: 0,
                is_exempt: false,
                source: "default",
              };
              // console.log("RateData:", rateData);
              return {
                id: hsn.id,
                hsn_code: hsn.code,
                name: hsn.description,
                type: hsn.type,
                cgst_rate: rate.cgst_rate ?? 0,
                sgst_rate: rate.sgst_rate ?? 0,
                igst_rate: rate.igst_rate ?? 0,
                cess_rate: rate.cess_rate ?? 0,
                is_exempt: rate.is_exempt ?? false,
                rate_source: rate.source ?? "default",
              };
            }),
          );

          setHsnCodes(codesWithRates);
        } catch (error) {
          console.error("Error fetching HSN codes with rates:", error);
          setHsnCodes([]);
        } finally {
          setLoading(false);
        }
      }, 300),
    [transactionDate],
  );

  useEffect(() => {
    fetchHsnWithRates(searchQuery);
  }, [searchQuery, fetchHsnWithRates]);

  const selectedHsn = hsnCodes.find((code) => code.hsn_code === value);

  const getRateLabel = (code: HsnCodeWithRate) => {
    if (code.is_exempt) {
      return "Exempt";
    }
    return `${code.igst_rate}%`;
  };

  const getRateSourceBadge = (source: string) => {
    const badges = {
      override: { label: "Override", color: "bg-orange-100 text-orange-700" },
      rule: { label: "Latest", color: "bg-green-100 text-green-700" },
      hsn_code: { label: "Base", color: "bg-blue-100 text-blue-700" },
      default: { label: "Default", color: "bg-gray-100 text-gray-700" },
    };
    return badges[source as keyof typeof badges] || badges.default;
  };

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
                ({getRateLabel(selectedHsn)})
              </span>
              {selectedHsn.rate_source === "override" && (
                <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                  Override
                </span>
              )}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search HSN/SAC code or description..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {loading
                ? "Loading..."
                : searchQuery.length < 2
                  ? "Type at least 2 characters..."
                  : "No HSN/SAC code found."}
            </CommandEmpty>
            <CommandGroup>
              {hsnCodes.map((code) => {
                const badge = getRateSourceBadge(code.rate_source);

                return (
                  <CommandItem
                    key={code.id}
                    value={code.hsn_code}
                    onSelect={() => {
                      onSelect(
                        code.hsn_code,
                        {
                          cgst: code.cgst_rate,
                          sgst: code.sgst_rate,
                          igst: code.igst_rate,
                          cess: code.cess_rate,
                          is_exempt: code.is_exempt,
                        },
                        code.name,
                      );
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === code.hsn_code ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{code.hsn_code}</span>
                        <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                          {code.type}
                        </span>
                        {code.is_exempt ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                            Exempt
                          </span>
                        ) : (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                            {code.igst_rate}%
                          </span>
                        )}
                        {code.rate_source !== "hsn_code" && (
                          <span
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded",
                              badge.color,
                            )}
                          >
                            {badge.label}
                          </span>
                        )}
                      </div>
                      {code.name && (
                        <span className="text-xs text-muted-foreground truncate mt-0.5">
                          {code.name}
                        </span>
                      )}
                      {!code.is_exempt && (
                        <span className="text-xs text-muted-foreground mt-0.5">
                          CGST: {code.cgst_rate}% | SGST: {code.sgst_rate}% |
                          IGST: {code.igst_rate}%
                          {code.cess_rate > 0 && ` | Cess: ${code.cess_rate}%`}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>

        {/* Info footer */}
        {hsnCodes.length > 0 && (
          <div className="border-t px-3 py-2 bg-muted/50">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>
                Rates shown are current as of{" "}
                {transactionDate || new Date().toLocaleDateString("en-IN")}.
                Source indicates if rate is from latest notification, override,
                or base data.
              </span>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
