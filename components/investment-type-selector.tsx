"use client"

import type React from "react"
import { Bitcoin, Briefcase, Globe, Palette, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface InvestmentType {
  id: string
  name: string
  icon: React.ElementType
  description: string
}

const investmentTypes: InvestmentType[] = [
  {
    id: "cryptocurrency",
    name: "Cryptocurrency",
    icon: Bitcoin,
    description: "Digital or virtual currencies like Bitcoin, Ethereum, etc.",
  },
  {
    id: "business",
    name: "Business Venture",
    icon: Briefcase,
    description: "Ownership stakes in private businesses or startups",
  },
  {
    id: "domain",
    name: "Domain Names",
    icon: Globe,
    description: "Internet domain names held as investments",
  },
  {
    id: "collectible",
    name: "Collectibles",
    icon: Palette,
    description: "Art, antiques, trading cards, or other collectible items",
  },
  {
    id: "intellectual_property",
    name: "Intellectual Property",
    icon: FileText,
    description: "Patents, trademarks, copyrights, or other IP assets",
  },
]

interface InvestmentTypeSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function InvestmentTypeSelector({ value, onChange }: InvestmentTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {investmentTypes.map((type) => {
        const Icon = type.icon
        const isSelected = value === type.id

        return (
          <div
            key={type.id}
            className={cn(
              "relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all",
              isSelected ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50",
            )}
            onClick={() => onChange(type.id)}
          >
            <Icon className={cn("h-8 w-8 mb-2", isSelected ? "text-primary" : "text-muted-foreground")} />
            <h3 className="font-medium text-center">{type.name}</h3>
            <p className="text-xs text-muted-foreground text-center mt-1">{type.description}</p>

            {isSelected && <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary" />}
          </div>
        )
      })}
    </div>
  )
}

