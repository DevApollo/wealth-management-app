import { TrendingUp, TrendingDown } from "lucide-react"

interface StockSummaryCardProps {
  symbol: string
  shares: number
  currentPrice: number | null
  purchasePrice: number | null
}

export function StockSummaryCard({ symbol, shares, currentPrice, purchasePrice }: StockSummaryCardProps) {
  // Convert to numbers to ensure proper calculations
  const numShares = Number(shares)
  const numCurrentPrice = currentPrice ? Number(currentPrice) : null
  const numPurchasePrice = purchasePrice ? Number(purchasePrice) : null

  // Use current price if available, otherwise use purchase price
  const displayPrice = numCurrentPrice || numPurchasePrice

  // Calculate total value
  const totalValue = displayPrice ? numShares * displayPrice : null

  // Calculate gain/loss if both prices are available
  let gainLoss = null
  let gainLossPercentage = null

  if (numCurrentPrice && numPurchasePrice) {
    gainLoss = (numCurrentPrice - numPurchasePrice) * numShares
    gainLossPercentage = ((numCurrentPrice - numPurchasePrice) / numPurchasePrice) * 100
  }

  return (
    <div className="space-y-2 p-3 border rounded-md">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{symbol}</span>
        <span className="text-sm">{numShares} shares</span>
      </div>

      {displayPrice && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Current Price</span>
          <span className="font-medium">${displayPrice.toFixed(2)}</span>
        </div>
      )}

      {totalValue && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Value</span>
          <span className="font-medium">${totalValue.toFixed(2)}</span>
        </div>
      )}

      {gainLoss && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Gain/Loss</span>
          <div className="flex items-center">
            {gainLoss > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span className={gainLoss > 0 ? "text-green-600" : "text-red-600"}>
              ${Math.abs(gainLoss).toFixed(2)} ({gainLossPercentage?.toFixed(2)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

