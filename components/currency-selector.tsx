"use client"

import { CURRENCIES, type CurrencyCode } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CurrencySelectorProps {
  value: CurrencyCode
  onChange: (value: CurrencyCode) => void
  id?: string
  name?: string
}

export function CurrencySelector({ value, onChange, id = "currency", name = "currency" }: CurrencySelectorProps) {
  return (
    <Select value={value} onValueChange={(val) => onChange(val as CurrencyCode)} name={name}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(CURRENCIES).map(([code, currency]) => (
          <SelectItem key={code} value={code}>
            <div className="flex items-center">
              <span className="mr-2">{currency.symbol}</span>
              <span>
                {currency.name} ({code})
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

