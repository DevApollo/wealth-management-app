import { requireAuth } from "@/lib/auth"
import { getHouseholdById, getInvestmentById, getUserDefaultCurrency } from "@/lib/db"
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { EditInvestmentForm } from "../../components/edit-investment-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EditInvestmentPage({
  params,
}: {
  params: { id: string; investmentId: string }
}) {
  const user = await requireAuth()
  const householdId = Number.parseInt(params.id)
  const investmentId = Number.parseInt(params.investmentId)

  // Get household details
  const household = await getHouseholdById(householdId)
  if (!household) {
    notFound()
  }

  // Get investment details
  const investment = await getInvestmentById(investmentId)
  if (!investment) {
    notFound()
  }

  // Get user's default currency
  const defaultCurrency = await getUserDefaultCurrency(user.id)

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, href: `/households/${householdId}` },
          { label: "Investments", href: `/households/${householdId}/investments` },
          { label: investment.name, href: `/households/${householdId}/investments/${investmentId}` },
          { label: "Edit", isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Edit Investment</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit {investment.name}</CardTitle>
          <CardDescription>Update the details of your investment</CardDescription>
        </CardHeader>
        <CardContent>
          <EditInvestmentForm householdId={householdId} investment={investment} defaultCurrency={defaultCurrency} />
        </CardContent>
      </Card>
    </div>
  )
}

