import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getHouseholdsByUserId } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatDate } from "@/lib/utils"
import { Home, Plus, Users } from "lucide-react"
import { DebugInfo } from "@/components/debug-info"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default async function HouseholdsPage() {
  const user = await requireAuth()

  // Get user's households
  const households = await getHouseholdsByUserId(user.id)

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Households", isCurrentPage: true }]} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Your Households</h1>
        <Link href="/households/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Household
          </Button>
        </Link>
      </div>

      {households.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No households yet</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">Create your first household to get started</p>
            <Link href="/households/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Household
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {households.map((household: any) => (
            <Link key={household.id} href={`/households/${household.id}`}>
              <Card className="h-full overflow-hidden transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <CardTitle>{household.name}</CardTitle>
                  <CardDescription>Created {formatDate(household.created_at)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-1 h-4 w-4" />
                    <span>View members</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Debug Information */}
      <DebugInfo
        data={{
          user: { id: user.id, name: user.name, email: user.email },
          households,
        }}
      />
    </div>
  )
}

