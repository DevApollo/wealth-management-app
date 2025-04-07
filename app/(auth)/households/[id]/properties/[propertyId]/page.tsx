import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getHouseholdById, getHouseholdMembers, getPropertyById } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatDate, formatCurrency, CURRENCIES } from "@/lib/utils"
import { notFound } from "next/navigation"
import { Pencil, User, Calendar } from "lucide-react"
import Link from "next/link"
import { DeletePropertyButton } from "@/components/delete-property-button"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string; propertyId: string }
}) {
  const user = await requireAuth()
  const householdId = Number.parseInt(params.id)
  const propertyId = Number.parseInt(params.propertyId)

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

  // Get property details
  const property = await getPropertyById(propertyId)
  if (!property || property.household_id !== householdId) {
    notFound()
  }

  // Get currency info
  const currencyCode = property.currency || "USD"
  const currencyInfo = CURRENCIES[currencyCode as keyof typeof CURRENCIES] || CURRENCIES.USD

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, href: `/households/${householdId}` },
          { label: "Properties", href: `/households/${householdId}/properties` },
          { label: property.name, isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{property.name}</h1>
          <p className="text-muted-foreground">Property in {household.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/households/${householdId}/properties/${propertyId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DeletePropertyButton propertyId={propertyId} propertyName={property.name} householdId={householdId} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>Information about this property</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
              <p className="whitespace-pre-line">{property.address}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
              <p className="text-xl font-semibold">
                {formatCurrency(property.price, currencyCode as any)}
                <span className="text-sm text-muted-foreground ml-2">({currencyInfo.name})</span>
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Monthly Maintenance</h3>
              <p className="text-xl font-semibold">
                {formatCurrency(property.maintenance_amount || 0, currencyCode as any)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Yearly Tax</h3>
              <p className="text-xl font-semibold">{formatCurrency(property.yearly_tax || 0, currencyCode as any)}</p>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Added by {property.created_by_name}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Added on {formatDate(property.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

