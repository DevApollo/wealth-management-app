import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, type CurrencyCode } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Building, Landmark, Car, CreditCard, TrendingUp, TrendingDown, DollarSign, Bookmark } from "lucide-react"

// Update the HouseholdDashboardProps interface to include investments
interface HouseholdDashboardProps {
  financialData: {
    totalAssets: number
    totalLiabilities: number
    netWorth: number
    monthlyPayments: number
    monthlyPropertyExpenses: number
    monthlyCarMaintenance: number
    monthlySubscriptions: number
    yearlySubscriptions: number
    totalMonthlyExpenses: number
    defaultCurrency: CurrencyCode
    assetDistribution: Array<{
      name: string
      value: number
      percentage: number
    }>
    monthlyPassiveIncome?: number
    annualDividendIncome?: number
    monthlyDividendIncome?: number
    totalPassiveIncome?: number
    totalMonthlyPassiveIncome?: number
    totalInvestments?: number
  }
}

export function HouseholdDashboard({ financialData }: HouseholdDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialData.totalAssets, financialData.defaultCurrency)}
            </div>
            <p className="text-xs text-muted-foreground">Properties, vehicles, and bank accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialData.totalLiabilities, financialData.defaultCurrency)}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding credits and loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financialData.netWorth >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(financialData.netWorth, financialData.defaultCurrency)}
            </div>
            <p className="text-xs text-muted-foreground">Assets minus liabilities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialData.totalMonthlyExpenses, financialData.defaultCurrency)}
            </div>
            <p className="text-xs text-muted-foreground">Total monthly expenses</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Subscription Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Costs</CardTitle>
            <CardDescription>Monthly and yearly subscription expenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Bookmark className="mr-2 h-4 w-4 text-primary" />
                <span>Monthly Subscriptions</span>
              </div>
              <span className="font-medium">
                {formatCurrency(financialData.monthlySubscriptions, financialData.defaultCurrency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Bookmark className="mr-2 h-4 w-4 text-primary" />
                <span>Yearly Subscriptions</span>
              </div>
              <span className="font-medium">
                {formatCurrency(financialData.yearlySubscriptions, financialData.defaultCurrency)}
              </span>
            </div>
            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                Subscriptions account for{" "}
                {Math.round((financialData.monthlySubscriptions / financialData.totalMonthlyExpenses) * 100)}% of your
                total monthly expenses.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Asset Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Distribution</CardTitle>
            <CardDescription>Breakdown of your assets by category (in {financialData.defaultCurrency})</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {financialData.assetDistribution.map((asset) => (
              <div key={asset.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {asset.name === "Properties" && <Building className="mr-2 h-4 w-4 text-primary" />}
                    {asset.name === "Bank Accounts" && <Landmark className="mr-2 h-4 w-4 text-primary" />}
                    {asset.name === "Vehicles" && <Car className="mr-2 h-4 w-4 text-primary" />}
                    {asset.name === "Investments" && <TrendingUp className="mr-2 h-4 w-4 text-primary" />}
                    <span>{asset.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {formatCurrency(asset.value, financialData.defaultCurrency)}
                    </span>
                    <span className="text-xs text-muted-foreground">({Math.round(asset.percentage)}%)</span>
                  </div>
                </div>
                <Progress value={asset.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Expenses</CardTitle>
            <CardDescription>Breakdown of your monthly expenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Credit Payments</span>
              <span className="font-medium">
                {formatCurrency(financialData.monthlyPayments, financialData.defaultCurrency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Property Expenses</span>
              <span className="font-medium">
                {formatCurrency(financialData.monthlyPropertyExpenses, financialData.defaultCurrency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Vehicle Maintenance</span>
              <span className="font-medium">
                {formatCurrency(financialData.monthlyCarMaintenance, financialData.defaultCurrency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Subscriptions</span>
              <span className="font-medium">
                {formatCurrency(financialData.monthlySubscriptions, financialData.defaultCurrency)}
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center font-semibold">
                <span>Total Monthly Expenses</span>
                <span>{formatCurrency(financialData.totalMonthlyExpenses, financialData.defaultCurrency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        {financialData.monthlyPassiveIncome > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Passive Income</CardTitle>
              <CardDescription>Monthly income from interest and dividends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Landmark className="mr-2 h-4 w-4 text-green-600" />
                  <span>Bank Account Interest</span>
                </div>
                <span className="font-medium text-green-600">
                  {formatCurrency(financialData.monthlyPassiveIncome, financialData.defaultCurrency)}
                </span>
              </div>

              {financialData.annualDividendIncome > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
                    <span>Stock Dividends (Monthly)</span>
                  </div>
                  <span className="font-medium text-green-600">
                    {formatCurrency(financialData.annualDividendIncome / 12, financialData.defaultCurrency)}
                  </span>
                </div>
              )}

              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center font-semibold text-green-600">
                  <span>Total Monthly Passive Income</span>
                  <span>
                    {formatCurrency(
                      financialData.monthlyPassiveIncome +
                        (financialData.annualDividendIncome ? financialData.annualDividendIncome / 12 : 0),
                      financialData.defaultCurrency,
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

