import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getHouseholdById, getHouseholdMembers, getPropertiesByHouseholdId } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatDate, formatCurrency } from "@/lib/utils"
import { notFound } from "next/navigation"
import { Plus, Building } from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default async function PropertiesPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireAuth()
  const householdId = Number.parseInt(params.id)

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

  // Get properties
  const properties = await getPropertiesByHouseholdId(householdId)

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, href: `/households/${householdId}` },
          { label: "Properties", isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">Manage properties for {household.name}</p>
        </div>
        <Link href={`/households/${householdId}/properties/create`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No properties yet</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">Add your first property to get started</p>
            <Link href={`/households/${householdId}/properties/create`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property: any) => (
            <Link key={property.id} href={`/households/${householdId}/properties/${property.id}`}>
              <Card className="h-full overflow-hidden transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <CardTitle>{property.name}</CardTitle>
                  <CardDescription className="truncate">{property.address}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div className="text-lg font-semibold">
                      {formatCurrency(property.price, property.currency || "USD")}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Building className="mr-1 h-4 w-4" />
                      <span>Added {formatDate(property.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

