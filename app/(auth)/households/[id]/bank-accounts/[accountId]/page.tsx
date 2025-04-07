import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getHouseholdById, getHouseholdMembers, getBankAccountById } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatDate, formatCurrency, CURRENCIES } from "@/lib/utils"
import { notFound } from "next/navigation"
import { Pencil, User, Calendar, Landmark } from "lucide-react"
import Link from "next/link"
import { DeleteBankAccountButton } from "@/components/delete-bank-account-button"
import { Breadcrumbs } from "@/components/breadcrumbs"

// Add a helper function to calculate monthly interest income
function calculateMonthlyInterestIncome(amount: number, annualInterestRate: number): number {
  // Convert annual rate to monthly and calculate interest
  return (Number(amount) * (Number(annualInterestRate) / 100)) / 12
}

export default async function BankAccountDetailPage({
  params,
}: {
  params: { id: string; accountId: string }
}) {
  const user = await requireAuth()
  const householdId = Number.parseInt(params.id)
  const accountId = Number.parseInt(params.accountId)

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

  // Get bank account details
  const bankAccount = await getBankAccountById(accountId)
  if (!bankAccount || bankAccount.household_id !== householdId) {
    notFound()
  }

  // Get currency info
  const currencyCode = bankAccount.currency || "USD"
  const currencyInfo = CURRENCIES[currencyCode as keyof typeof CURRENCIES] || CURRENCIES.USD

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, href: `/households/${householdId}` },
          { label: "Bank Accounts", href: `/households/${householdId}/bank-accounts` },
          { label: bankAccount.name, isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bankAccount.name}</h1>
          <p className="text-muted-foreground">Bank account in {household.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/households/${householdId}/bank-accounts/${accountId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DeleteBankAccountButton
            bankAccountId={accountId}
            bankAccountName={bankAccount.name}
            householdId={householdId}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bank Account Details</CardTitle>
            <CardDescription>Information about this bank account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Bank Name</h3>
                <p className="text-xl font-semibold">{bankAccount.bank_name}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
                <p className="text-xl font-semibold">
                  {formatCurrency(bankAccount.amount, currencyCode as any)}
                  <span className="text-sm text-muted-foreground ml-2">({currencyInfo.name})</span>
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Annual Interest Rate</h3>
                <p className="text-xl font-semibold">{Number(bankAccount.interest_rate || 0).toFixed(2)}%</p>
              </div>

              {bankAccount.interest_rate > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Monthly Passive Income</h3>
                  <p className="text-xl font-semibold text-green-600">
                    {formatCurrency(
                      calculateMonthlyInterestIncome(bankAccount.amount, Number(bankAccount.interest_rate)),
                      currencyCode as any,
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              <span>Bank Account</span>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Added by {bankAccount.created_by_name}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Added on {formatDate(bankAccount.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

