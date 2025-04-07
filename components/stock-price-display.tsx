"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StockPriceDisplayProps {
  symbol: string
  shares: number
  purchasePrice?: number | null
}

interface StockData {
  symbol: string
  price: number
  change: number
  changePercent: string
  lastUpdated: string
}

export function StockPriceDisplay({ symbol, shares, purchasePrice }: StockPriceDisplayProps) {
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  async function fetchStockData() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/stocks/${symbol}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch stock data")
      }

      const data = await response.json()
      setStockData(data.stock)
      setLastUpdated(new Date())
    } catch (error: any) {
      setError(error.message || "Failed to fetch stock data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStockData()

    // Refresh every 5 minutes
    const interval = setInterval(fetchStockData, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [symbol])

  // Calculate total value and gain/loss
  const totalValue = stockData ? stockData.price * shares : 0
  const totalGainLoss = purchasePrice && stockData ? (stockData.price - purchasePrice) * shares : null
  const percentGainLoss = purchasePrice && stockData ? ((stockData.price - purchasePrice) / purchasePrice) * 100 : null

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {isLoading && !stockData ? (
          <div className="flex items-center justify-center h-24">
            <p className="text-sm text-muted-foreground">Loading stock data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-24 space-y-2">
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchStockData}>
              <RefreshCw className="mr-2 h-3 w-3" />
              Retry
            </Button>
          </div>
        ) : stockData ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{stockData.symbol}</h3>
                <p className="text-2xl font-bold">${stockData.price.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <div className={`flex items-center ${stockData.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {stockData.change >= 0 ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  <span>
                    {stockData.change >= 0 ? "+" : ""}
                    {stockData.change.toFixed(2)} ({stockData.changePercent}%)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Last updated: {lastUpdated?.toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Shares</p>
                <p className="font-medium">{shares.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="font-medium">${totalValue.toFixed(2)}</p>
              </div>

              {purchasePrice && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Price</p>
                    <p className="font-medium">${purchasePrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gain/Loss</p>
                    <p
                      className={`font-medium ${totalGainLoss && totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {totalGainLoss
                        ? `${totalGainLoss >= 0 ? "+" : ""}$${Math.abs(totalGainLoss).toFixed(2)} (${percentGainLoss?.toFixed(2)}%)`
                        : "N/A"}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={fetchStockData} className="text-xs">
                <RefreshCw className="mr-1 h-3 w-3" />
                Refresh
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

