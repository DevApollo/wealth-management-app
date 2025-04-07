import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  getHouseholdById,
  getHouseholdMembers,
  getPropertiesByHouseholdId,
  getCreditsByHouseholdId,
  getBankAccountsByHouseholdId,
  getVehiclesByHouseholdId,
  getUserDefaultCurrency,
  getCurrencyRate,
  getSubscriptionsByHouseholdId,
  getStocksByHouseholdId,
  getPassiveIncomeByHouseholdId,
  getInvestmentsByHouseholdId,
} from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatDate, convertCurrency, type CurrencyCode, formatCurrency } from "@/lib/utils"
import { notFound } from "next/navigation"
import { UserPlus, User, Bookmark } from "lucide-react"
import Link from "next/link"
import { DeleteMemberButton } from "@/components/delete-member-button"
import { deleteMember } from "../../../actions"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { HouseholdDashboard } from "@/components/household-dashboard"
import {
  Tabs as TabsComponent,
  TabsList as TabsListComponent,
  TabsTrigger as TabsTriggerComponent,
  TabsContent as TabsContentComponent,
} from "@/components/ui/tabs"

export default async function HouseholdPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireAuth()
  const householdId = Number.parseInt(params.id)

  // Get user's default currency
  const defaultCurrency = (await getUserDefaultCurrency(user.id)) as CurrencyCode

  // Get household details
  const household = await getHouseholdById(householdId)
  if (!household) {
    notFound()
  }

  // Get household members
  const members = await getHouseholdMembers(householdId)

  // Check if user is a member of this household
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    notFound()
  }

  // Check if user is the owner
  const isOwner = members.some((member: any) => member.id === user.id && member.role === "owner")

  // Get financial data
  const properties = await getPropertiesByHouseholdId(householdId)
  const credits = await getCreditsByHouseholdId(householdId)
  const bankAccounts = await getBankAccountsByHouseholdId(householdId)
  const vehicles = await getVehiclesByHouseholdId(householdId)
  const subscriptions = await getSubscriptionsByHouseholdId(householdId)
  const stocks = await getStocksByHouseholdId(householdId)

  // Convert all values to default currency
  let totalProperties = 0
  let totalBankAccounts = 0
  let totalVehicles = 0
  let totalLiabilities = 0
  let monthlyPayments = 0
  let monthlyPropertyExpenses = 0
  let monthlyCarMaintenance = 0
  let monthlySubscriptions = 0
  let yearlySubscriptions = 0
  let annualDividendIncome = 0
  let netWorth = 0
  let totalMonthlyPassiveIncome = 0

  // Add a helper function to calculate monthly interest income
  function calculateMonthlyInterestIncome(amount: number, annualInterestRate: number): number {
    // Convert annual rate to monthly and calculate interest
    return (amount * (annualInterestRate / 100)) / 12
  }

  // Add a variable to track total monthly passive income from bank accounts
  let monthlyPassiveIncome = 0
  let monthlyDividendIncome = 0

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
          monthlyPassiveIncome += calculateMonthlyInterestIncome(Number(account.amount), Number(account.interest_rate))
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

  // Add passive income processing to the household page
  // Add this after the stocks processing section
  // Process stocks
  for (const stock of stocks) {
    const currency = stock.currency || "USD"
    if (currency === defaultCurrency) {
      annualDividendIncome += Number(stock.annual_dividend_income || 0)
    } else {
      const rate = await getCurrencyRate(currency, defaultCurrency)
      if (rate) {
        annualDividendIncome += convertCurrency(Number(stock.annual_dividend_income || 0), rate.rate)
      } else {
        annualDividendIncome += Number(stock.annual_dividend_income || 0) // Fallback if no rate found
      }
    }
  }

  // Calculate monthly dividend income
  monthlyDividendIncome = annualDividendIncome / 12

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

  // Add this after the stocks processing section, before calculating totalAssets
  // Process investments
  let totalInvestments = 0
  const investments = await getInvestmentsByHouseholdId(householdId)

  for (const investment of investments) {
    const currency = investment.currency || "USD"
    const currentValue = investment.current_value ? Number(investment.current_value) : Number(investment.amount)

    if (currency === defaultCurrency) {
      totalInvestments += currentValue
    } else {
      const rate = await getCurrencyRate(currency, defaultCurrency)
      if (rate) {
        totalInvestments += convertCurrency(currentValue, rate.rate)
      } else {
        totalInvestments += currentValue // Fallback if no rate found
      }
    }
  }

  // Update the totalAssets calculation to include investments
  const totalAssets = totalProperties + totalBankAccounts + totalVehicles + totalInvestments

  netWorth = totalAssets - totalLiabilities

  // Update the assetDistribution array to include investments
  const assetDistribution = [
    { name: "Properties", value: totalProperties, percentage: totalAssets ? (totalProperties / totalAssets) * 100 : 0 },
    {
      name: "Bank Accounts",
      value: totalBankAccounts,
      percentage: totalAssets ? (totalBankAccounts / totalAssets) * 100 : 0,
    },
    { name: "Vehicles", value: totalVehicles, percentage: totalAssets ? (totalVehicles / totalAssets) * 100 : 0 },
    {
      name: "Investments",
      value: totalInvestments,
      percentage: totalAssets ? (totalInvestments / totalAssets) * 100 : 0,
    },
  ]

  // Calculate total monthly expenses
  const totalMonthlyExpenses = monthlyPayments + monthlyPropertyExpenses + monthlyCarMaintenance + monthlySubscriptions

  totalMonthlyPassiveIncome = monthlyPassiveIncome + monthlyDividendIncome + totalPassiveIncome

  // Add monthlyPassiveIncome to financialData
  const financialData = {
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
    investments: investments.length,
    totalInvestments,
    defaultCurrency,
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{household.name}</h1>
        <div className="flex gap-2">
          {isOwner && (
            <Link href={`/households/${householdId}/add-member`}>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </Link>
          )}
        </div>
      </div>

      <TabsComponent defaultValue="overview">
        <TabsListComponent>
          <TabsTriggerComponent value="overview">Overview</TabsTriggerComponent>
          <TabsTriggerComponent value="members">Members</TabsTriggerComponent>
          <TabsTriggerComponent value="subscriptions">Subscriptions</TabsTriggerComponent>
          <TabsTriggerComponent value="details">Household Details</TabsTriggerComponent>
        </TabsListComponent>

        <TabsContentComponent value="overview" className="pt-4">
          <HouseholdDashboard financialData={financialData} />
        </TabsContentComponent>

        <TabsContentComponent value="members" className="pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Members</CardTitle>
                <CardDescription>People in this household</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-primary/10 p-2">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-muted-foreground capitalize">{member.role}</div>
                      {isOwner && member.id !== user.id && member.role !== "owner" && (
                        <DeleteMemberButton
                          householdId={householdId}
                          memberId={member.id}
                          memberName={member.name}
                          onDelete={async (memberId) => {
                            return await deleteMember(householdId, memberId)
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContentComponent>

        <TabsContentComponent value="subscriptions" className="pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Subscriptions</CardTitle>
                <CardDescription>Recurring payments</CardDescription>
              </div>
              <Link href={`/households/${householdId}/subscriptions`}>
                <Button size="sm">
                  <Bookmark className="mr-2 h-4 w-4" />
                  Manage Subscriptions
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No subscriptions yet</p>
                    <div className="mt-4">
                      <Link href={`/households/${householdId}/subscriptions/create`}>
                        <Button size="sm">Add Subscription</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 font-medium text-sm pb-2 border-b">
                      <div>Name</div>
                      <div>Price</div>
                      <div>Billing</div>
                    </div>
                    {subscriptions.slice(0, 5).map((subscription: any) => (
                      <div key={subscription.id} className="grid grid-cols-3 text-sm py-2 border-b last:border-0">
                        <div className="font-medium">{subscription.name}</div>
                        <div>{formatCurrency(subscription.price, subscription.currency)}</div>
                        <div className="capitalize">{subscription.billing_cycle}</div>
                      </div>
                    ))}
                    {subscriptions.length > 5 && (
                      <div className="text-center pt-2">
                        <Link href={`/households/${householdId}/subscriptions`}>
                          <Button variant="link" size="sm">
                            View all {subscriptions.length} subscriptions
                          </Button>
                        </Link>
                      </div>
                    )}
                    <div className="pt-4 flex justify-between font-medium">
                      <span>Monthly Total:</span>
                      <span>{formatCurrency(monthlySubscriptions, defaultCurrency)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Yearly Total:</span>
                      <span>{formatCurrency(yearlySubscriptions, defaultCurrency)}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContentComponent>

        <TabsContentComponent value="details" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Household Details</CardTitle>
              <CardDescription>Information about this household</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(household.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span>{members.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Properties</span>
                <span>{properties.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank Accounts</span>
                <span>{bankAccounts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credits & Liabilities</span>
                <span>{credits.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicles</span>
                <span>{vehicles.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscriptions</span>
                <span>{subscriptions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Investments</span>
                <span>{investments.length}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContentComponent>
      </TabsComponent>
    </div>
  )
}

