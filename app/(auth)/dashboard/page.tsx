import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  getHouseholdsByUserId,
  getInvitationsByEmail,
  getPropertiesByHouseholdId,
  getCreditsByHouseholdId,
  getBankAccountsByHouseholdId,
  getVehiclesByHouseholdId,
  getUserDefaultCurrency,
  getCurrencyRate,
  getSubscriptionsByHouseholdId,
  getStocksByHouseholdId,
  getPassiveIncomeByHouseholdId,
} from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatCurrency, convertCurrency, type CurrencyCode } from "@/lib/utils"
import { InvitationCard } from "@/components/ui-components"
import {
  Home,
  Building,
  CreditCard,
  Car,
  Landmark,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowRight,
  Bookmark,
} from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Progress } from "@/components/ui/progress"
import { StockSummaryCard } from "@/components/stock-summary-card"

export default async function DashboardPage() {
  const user = await requireAuth()

  // Get user's default currency
  const defaultCurrency = (await getUserDefaultCurrency(user.id)) as CurrencyCode

  // Get user's households
  const households = await getHouseholdsByUserId(user.id)

  // Get pending invitations
  const invitations = await getInvitationsByEmail(user.email)

  // If user has at least one household, get financial data for the first one
  let financialData = null
  let selectedHousehold = null
  let topStocks = []

  if (households.length > 0) {
    selectedHousehold = households[0]
    const householdId = selectedHousehold.id

    // Get all financial data
    const properties = await getPropertiesByHouseholdId(householdId)
    const credits = await getCreditsByHouseholdId(householdId)
    const bankAccounts = await getBankAccountsByHouseholdId(householdId)
    const vehicles = await getVehiclesByHouseholdId(householdId)
    const subscriptions = await getSubscriptionsByHouseholdId(householdId)
    const stocks = await getStocksByHouseholdId(householdId)

    // Get top 3 stocks for display
    topStocks = stocks.slice(0, 3)

    // Convert all values to default currency
    let totalProperties = 0
    let totalBankAccounts = 0
    let totalVehicles = 0
    let totalStocks = 0
    let totalLiabilities = 0
    let monthlyPayments = 0
    let monthlyPropertyExpenses = 0
    let monthlyCarMaintenance = 0
    let monthlySubscriptions = 0
    let yearlySubscriptions = 0
    let annualDividendIncome = 0

    // Add a helper function to calculate monthly interest income
    function calculateMonthlyInterestIncome(amount: number, annualInterestRate: number): number {
      // Convert annual rate to monthly and calculate interest
      return (amount * (annualInterestRate / 100)) / 12
    }

    // Add a variable to track total monthly passive income from bank accounts
    let monthlyPassiveIncome = 0

    // Process properties
    for (const prop of properties) {
      const currency = prop.currency || "USD"
      if (currency === defaultCurrency) {
        totalProperties += Number(prop.price)
        monthlyPropertyExpenses += Number(prop.maintenance_amount || 0) + Number(prop.yearly_tax || 0) / 12
      } else {
        const rate = await getCurrencyRate(currency, defaultCurrency)
        if (rate) {
          totalProperties += convertCurrency(Number(prop.price), rate.rate)
          monthlyPropertyExpenses +=
            convertCurrency(Number(prop.maintenance_amount || 0), rate.rate) +
            convertCurrency(Number(prop.yearly_tax || 0), rate.rate) / 12
        } else {
          totalProperties += Number(prop.price) // Fallback if no rate found
          monthlyPropertyExpenses += Number(prop.maintenance_amount || 0) + Number(prop.yearly_tax || 0) / 12
        }
      }
    }

    // Update the bank accounts processing section to calculate passive income
    // Process bank accounts
    for (const account of bankAccounts) {
      const currency = account.currency || "USD"
      if (currency === defaultCurrency) {
        totalBankAccounts += Number(account.amount)
        // Calculate monthly passive income
        if (account.interest_rate) {
          monthlyPassiveIncome += calculateMonthlyInterestIncome(Number(account.amount), Number(account.interest_rate))
        }
      } else {
        const rate = await getCurrencyRate(currency, defaultCurrency)
        if (rate) {
          totalBankAccounts += convertCurrency(Number(account.amount), rate.rate)
          // Calculate monthly passive income with currency conversion
          if (account.interest_rate) {
            monthlyPassiveIncome += convertCurrency(
              calculateMonthlyInterestIncome(Number(account.amount), Number(account.interest_rate)),
              rate.rate,
            )
          }
        } else {
          totalBankAccounts += Number(account.amount) // Fallback if no rate found
          // Calculate monthly passive income without conversion
          if (account.interest_rate) {
            monthlyPassiveIncome += calculateMonthlyInterestIncome(
              Number(account.amount),
              Number(account.interest_rate),
            )
          }
        }
      }
    }

    // Process vehicles
    for (const vehicle of vehicles) {
      const currency = vehicle.currency || "USD"
      if (currency === defaultCurrency) {
        totalVehicles += Number(vehicle.sale_price || 0)
        monthlyCarMaintenance += Number(vehicle.maintenance_costs || 0) / 12
      } else {
        const rate = await getCurrencyRate(currency, defaultCurrency)
        if (rate) {
          totalVehicles += convertCurrency(Number(vehicle.sale_price || 0), rate.rate)
          monthlyCarMaintenance += convertCurrency(Number(vehicle.maintenance_costs || 0), rate.rate) / 12
        } else {
          totalVehicles += Number(vehicle.sale_price || 0) // Fallback if no rate found
          monthlyCarMaintenance += Number(vehicle.maintenance_costs || 0) / 12
        }
      }
    }

    // Process stocks - use current_price if available, otherwise use purchase_price
    for (const stock of stocks) {
      const stockPrice = stock.current_price || stock.purchase_price
      if (stockPrice) {
        const totalValue = Number(stock.shares) * Number(stockPrice)
        totalStocks += totalValue

        // Calculate dividend income if available
        if (stock.dividend_yield) {
          const dividendYield = Number(stock.dividend_yield)
          const annualDividend = (totalValue * dividendYield) / 100
          annualDividendIncome += annualDividend
        }
      }
    }

    // Update the financial data section to include passive income
    // Add this after the stocks processing section
    // Process passive income
    let totalPassiveIncome = 0
    const passiveIncomes = await getPassiveIncomeByHouseholdId(householdId)

    for (const income of passiveIncomes) {
      const currency = income.currency || "USD"
      let monthlyAmount = 0

      // Convert to monthly amount based on frequency
      if (income.frequency === "monthly") {
        monthlyAmount = Number(income.amount)
      } else if (income.frequency === "annually") {
        monthlyAmount = Number(income.amount) / 12
      } else if (income.frequency === "quarterly") {
        monthlyAmount = Number(income.amount) / 3
      } else if (income.frequency === "weekly") {
        monthlyAmount = Number(income.amount) * 4.33 // Average weeks per month
      } else if (income.frequency === "bi-weekly") {
        monthlyAmount = Number(income.amount) * 2.17 // Average bi-weeks per month
      }

      // Convert to default currency if needed
      if (currency !== defaultCurrency) {
        const rate = await getCurrencyRate(currency, defaultCurrency)
        if (rate) {
          monthlyAmount = convertCurrency(monthlyAmount, rate.rate)
        }
      }

      totalPassiveIncome += monthlyAmount
    }

    // Process credits
    for (const credit of credits) {
      const currency = credit.currency || "USD"
      if (currency === defaultCurrency) {
        totalLiabilities += Number(credit.remaining_amount)
        monthlyPayments += Number(credit.monthly_payment)
      } else {
        const rate = await getCurrencyRate(currency, defaultCurrency)
        if (rate) {
          totalLiabilities += convertCurrency(Number(credit.remaining_amount), rate.rate)
          monthlyPayments += convertCurrency(Number(credit.monthly_payment), rate.rate)
        } else {
          totalLiabilities += Number(credit.remaining_amount) // Fallback if no rate found
          monthlyPayments += Number(credit.monthly_payment) // Fallback if no rate found
        }
      }
    }

    // Process subscriptions
    for (const subscription of subscriptions) {
      const currency = subscription.currency || "USD"
      const price = Number(subscription.price)
      let monthlyPrice = 0
      let yearlyPrice = 0

      // Convert to monthly and yearly based on billing cycle
      if (subscription.billing_cycle === "monthly") {
        monthlyPrice = price
        yearlyPrice = price * 12
      } else if (subscription.billing_cycle === "yearly") {
        monthlyPrice = price / 12
        yearlyPrice = price
      } else if (subscription.billing_cycle === "weekly") {
        monthlyPrice = price * 4.33 // Average weeks per month
        yearlyPrice = price * 52 // Weeks per year
      }

      // Convert to default currency if needed
      if (currency !== defaultCurrency) {
        const rate = await getCurrencyRate(currency, defaultCurrency)
        if (rate) {
          monthlyPrice = convertCurrency(monthlyPrice, rate.rate)
          yearlyPrice = convertCurrency(yearlyPrice, rate.rate)
        }
      }

      monthlySubscriptions += monthlyPrice
      yearlySubscriptions += yearlyPrice
    }

    const totalAssets = totalProperties + totalBankAccounts + totalVehicles + totalStocks
    const netWorth = totalAssets - totalLiabilities

    // Calculate monthly dividend income
    const monthlyDividendIncome = annualDividendIncome / 12

    // Calculate total monthly passive income
    const totalMonthlyPassiveIncome = monthlyPassiveIncome + monthlyDividendIncome + totalPassiveIncome

    // Asset distribution
    const assetDistribution = [
      {
        name: "Properties",
        value: totalProperties,
        percentage: totalAssets ? (totalProperties / totalAssets) * 100 : 0,
      },
      {
        name: "Bank Accounts",
        value: totalBankAccounts,
        percentage: totalAssets ? (totalBankAccounts / totalAssets) * 100 : 0,
      },
      { name: "Vehicles", value: totalVehicles, percentage: totalAssets ? (totalVehicles / totalAssets) * 100 : 0 },
      { name: "Stocks", value: totalStocks, percentage: totalAssets ? (totalStocks / totalAssets) * 100 : 0 },
    ]

    const totalMonthlyExpenses =
      monthlyPayments + monthlyPropertyExpenses + monthlyCarMaintenance + monthlySubscriptions

    // Add monthlyPassiveIncome to financialData
    financialData = {
      totalAssets,
      totalLiabilities,
      netWorth,
      monthlyPayments,
      monthlyPropertyExpenses,
      monthlyCarMaintenance,
      monthlySubscriptions,
      yearlySubscriptions,
      totalMonthlyExpenses,
      assetDistribution,
      properties: properties.length,
      bankAccounts: bankAccounts.length,
      credits: credits.length,
      vehicles: vehicles.length,
      subscriptions: subscriptions.length,
      stocks: stocks.length,
      annualDividendIncome,
      monthlyPassiveIncome,
      monthlyDividendIncome,
      totalMonthlyPassiveIncome,
      totalPassiveIncome,
      passiveIncomes: passiveIncomes.length,
      defaultCurrency,
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", isCurrentPage: true }]} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pending Invitations</h2>
          <div>
            {invitations.map((invitation: any) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                onAccept={async () => {
                  "use server"
                  // This will be handled by the client component
                }}
                onReject={async () => {
                  "use server"
                  // This will be handled by the client component
                }}
                isLoading={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Financial Overview */}
      {financialData && selectedHousehold && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Financial Overview: {selectedHousehold.name}</h2>
            <Link href={`/households/${selectedHousehold.id}`}>
              <Button variant="outline" size="sm">
                View Household <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Key Financial Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-green-50 dark:bg-green-900/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Monthly Passive Income</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(financialData.totalMonthlyPassiveIncome, financialData.defaultCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">Interest and dividend income</p>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-900/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Monthly Expenses</CardTitle>
                <CreditCard className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(financialData.totalMonthlyExpenses, financialData.defaultCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">All monthly expenses combined</p>
              </CardContent>
            </Card>

            <Card
              className={
                financialData.netWorth >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"
              }
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
                <TrendingUp className={`h-4 w-4 ${financialData.netWorth >= 0 ? "text-green-600" : "text-red-600"}`} />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${financialData.netWorth >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(financialData.netWorth, financialData.defaultCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">Assets minus liabilities</p>
              </CardContent>
            </Card>
          </div>

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
                <p className="text-xs text-muted-foreground">Properties, vehicles, stocks, and bank accounts</p>
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
                <CardTitle className="text-sm font-medium">Monthly Subscriptions</CardTitle>
                <Bookmark className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(financialData.monthlySubscriptions, financialData.defaultCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">Total monthly subscription costs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Property Expenses</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(financialData.monthlyPropertyExpenses, financialData.defaultCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">Maintenance and taxes</p>
              </CardContent>
            </Card>
          </div>

          {/* Passive Income Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Passive Income Breakdown</CardTitle>
              <CardDescription>Monthly income from various sources</CardDescription>
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
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
                  <span>Stock Dividends</span>
                </div>
                <span className="font-medium text-green-600">
                  {formatCurrency(financialData.monthlyDividendIncome, financialData.defaultCurrency)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-green-600" />
                  <span>Other Passive Income</span>
                </div>
                <span className="font-medium text-green-600">
                  {formatCurrency(financialData.totalPassiveIncome, financialData.defaultCurrency)}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center font-semibold text-green-600">
                  <span>Total Monthly Passive Income</span>
                  <span>{formatCurrency(financialData.totalMonthlyPassiveIncome, financialData.defaultCurrency)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                  <span>Annual Passive Income</span>
                  <span>
                    {formatCurrency(financialData.totalMonthlyPassiveIncome * 12, financialData.defaultCurrency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Portfolio Preview */}
          {topStocks.length > 0 && (
            <Card>
              <CardHeader className="flex justify-between items-center">
                <div>
                  <CardTitle>Stock Portfolio</CardTitle>
                  <CardDescription>Your top stock investments</CardDescription>
                </div>
                <Link href={`/households/${selectedHousehold.id}/stocks`}>
                  <Button variant="outline" size="sm">
                    View All Stocks
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {topStocks.map((stock: any) => (
                    <div key={stock.id} className="space-y-2">
                      <Link href={`/households/${selectedHousehold.id}/stocks/${stock.id}`}>
                        <h3 className="font-medium hover:underline">{stock.symbol}</h3>
                      </Link>
                      <StockSummaryCard
                        symbol={stock.symbol}
                        shares={stock.shares}
                        currentPrice={stock.current_price}
                        purchasePrice={stock.purchase_price}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Asset Distribution */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Asset Distribution</CardTitle>
                <CardDescription>
                  Breakdown of your assets by category (in {financialData.defaultCurrency})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {financialData.assetDistribution.map((asset) => (
                  <div key={asset.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {asset.name === "Properties" && <Building className="mr-2 h-4 w-4 text-primary" />}
                        {asset.name === "Bank Accounts" && <Landmark className="mr-2 h-4 w-4 text-primary" />}
                        {asset.name === "Vehicles" && <Car className="mr-2 h-4 w-4 text-primary" />}
                        {asset.name === "Stocks" && <TrendingUp className="mr-2 h-4 w-4 text-primary" />}
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

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
                <CardDescription>Manage your household assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Link href={`/households/${selectedHousehold.id}/properties`} className="w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <Building className="mr-2 h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span>Properties</span>
                        <span className="text-xs text-muted-foreground">{financialData.properties} items</span>
                      </div>
                    </Button>
                  </Link>

                  <Link href={`/households/${selectedHousehold.id}/bank-accounts`} className="w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <Landmark className="mr-2 h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span>Bank Accounts</span>
                        <span className="text-xs text-muted-foreground">{financialData.bankAccounts} items</span>
                      </div>
                    </Button>
                  </Link>

                  <Link href={`/households/${selectedHousehold.id}/credits`} className="w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span>Credits</span>
                        <span className="text-xs text-muted-foreground">{financialData.credits} items</span>
                      </div>
                    </Button>
                  </Link>

                  <Link href={`/households/${selectedHousehold.id}/vehicles`} className="w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <Car className="mr-2 h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span>Vehicles</span>
                        <span className="text-xs text-muted-foreground">{financialData.vehicles} items</span>
                      </div>
                    </Button>
                  </Link>

                  <Link href={`/households/${selectedHousehold.id}/stocks`} className="w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span>Stocks</span>
                        <span className="text-xs text-muted-foreground">{financialData.stocks} items</span>
                      </div>
                    </Button>
                  </Link>

                  <Link href={`/households/${selectedHousehold.id}/subscriptions`} className="w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <Bookmark className="mr-2 h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span>Subscriptions</span>
                        <span className="text-xs text-muted-foreground">{financialData.subscriptions} items</span>
                      </div>
                    </Button>
                  </Link>
                  {/* Add passive income to the Quick Access section */}
                  <Link href={`/households/${selectedHousehold.id}/passive-income`} className="w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <DollarSign className="mr-2 h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span>Passive Income</span>
                        <span className="text-xs text-muted-foreground">{financialData.passiveIncomes} sources</span>
                      </div>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
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
          </div>
        </div>
      )}

      {/* No Household Message */}
      {households.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No household yet</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Please contact your administrator to set up your household.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

