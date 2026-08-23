/**
 * A searchable country picker.
 *
 * Thirty-one countries in a plain dropdown means scrolling past Indonesia to
 * reach Egypt. Typing two letters is faster and, unlike a text field, cannot
 * store "Egpyt" — the value only ever comes from the list.
 */
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PRICED_COUNTRIES, getCurrencyForCountry } from "@/lib/stripePrices";

interface CountryComboboxProps {
  /** "" means not set. */
  value: string;
  onChange: (country: string) => void;
  id?: string;
  placeholder?: string;
}

const NOT_SET = "Not set";

export const CountryCombobox = ({
  value, onChange, id, placeholder = "Search countries…",
}: CountryComboboxProps) => {
  const [open, setOpen] = useState(false);

  const pick = (country: string) => {
    onChange(country === NOT_SET ? "" : country);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {value || NOT_SET}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No country by that name.</CommandEmpty>
            <CommandGroup>
              <CommandItem value={NOT_SET} onSelect={() => pick(NOT_SET)}>
                <Check className={cn("mr-2 h-4 w-4", value ? "opacity-0" : "opacity-100")} />
                <span className="text-muted-foreground">{NOT_SET}</span>
              </CommandItem>
              {PRICED_COUNTRIES.map(country => {
                const currency = getCurrencyForCountry(country);
                return (
                  <CommandItem key={country} value={country} onSelect={() => pick(country)}>
                    <Check
                      className={cn("mr-2 h-4 w-4", value === country ? "opacity-100" : "opacity-0")}
                    />
                    {country}
                    {/* Shown so the currency a country implies is visible before choosing it. */}
                    {currency && (
                      <span className="ml-auto pl-2 text-xs text-muted-foreground">{currency}</span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CountryCombobox;
