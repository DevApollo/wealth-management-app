"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { useParams } from "next/navigation"
import {
  Plus,
  Bookmark,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SubscriptionModal } from "@/components/subscription-modal"
import { deleteSubscriptionAction } from "./actions"
import { Alert } from "@/components/ui-components"

// Define subscription type
type Subscription = {
  id: number
  name: string
  description: string | null
  price: number
  currency: string
  billing_cycle: string
  priority: string
  household_id: number
  created_by: number
  created_by_name: string
  created_at: string
  updated_at: string | null
}

// Helper function to get priority badge class
const getPriorityBadgeClass = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 hover:bg-red-100"
    case "medium":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    case "low":
      return "bg-green-100 text-green-800 hover:bg-green-100"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100"
  }
}

// Helper function to get billing cycle display text
const getBillingCycleText = (cycle: string) => {
  switch (cycle) {
    case "monthly":
      return "Monthly"
    case "yearly":
      return "Yearly"
    case "weekly":
      return "Weekly"
    default:
      return cycle.charAt(0).toUpperCase() + cycle.slice(1)
  }
}

export default function SubscriptionsPage() {
  const params = useParams()
  const householdId = Number.parseInt(params.id as string)

  // State for subscriptions data
  const [household, setHousehold] = useState<any>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [billingCycleFilter, setBillingCycleFilter] = useState<string>("")
  const [sortColumn, setSortColumn] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // State for modal
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [modalMode, setModalMode] = useState<"view" | "edit">("view")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch household data
      const householdRes = await fetch(`/api/households/${householdId}`)
      if (!householdRes.ok) {
        throw new Error("Failed to fetch household")
      }
      const householdData = await householdRes.json()
      setHousehold(householdData)

      // Fetch subscriptions
      const subscriptionsRes = await fetch(`/api/households/${householdId}/subscriptions`)
      if (!subscriptionsRes.ok) {
        throw new Error("Failed to fetch subscriptions")
      }
      const subscriptionsData = await subscriptionsRes.json()
      setSubscriptions(subscriptionsData)
    } catch (err: any) {
      setError(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [householdId])

  // Calculate monthly and yearly totals
  const monthlyTotal = subscriptions.reduce((total: number, sub: Subscription) => {
    if (sub.billing_cycle === "monthly") {
      return total + Number(sub.price)
    } else if (sub.billing_cycle === "yearly") {
      return total + Number(sub.price) / 12
    } else if (sub.billing_cycle === "weekly") {
      return total + Number(sub.price) * 4.33 // Average weeks per month
    } else {
      return total
    }
  }, 0)

  const yearlyTotal = subscriptions.reduce((total: number, sub: Subscription) => {
    if (sub.billing_cycle === "yearly") {
      return total + Number(sub.price)
    } else if (sub.billing_cycle === "monthly") {
      return total + Number(sub.price) * 12
    } else if (sub.billing_cycle === "weekly") {
      return total + Number(sub.price) * 52 // Weeks per year
    } else {
      return total
    }
  }, 0)

  // Filter and sort subscriptions
  const filteredSubscriptions = subscriptions
    .filter((sub) => {
      // Search filter
      const searchMatch =
        searchQuery === "" ||
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.description && sub.description.toLowerCase().includes(searchQuery.toLowerCase()))

      // Priority filter
      const priorityMatch = priorityFilter.length === 0 || priorityFilter.includes(sub.priority)

      // Billing cycle filter
      const billingCycleMatch = billingCycleFilter === "" || sub.billing_cycle === billingCycleFilter

      return searchMatch && priorityMatch && billingCycleMatch
    })
    .sort((a, b) => {
      // Sort by selected column
      let comparison = 0

      switch (sortColumn) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "price":
          comparison = Number(a.price) - Number(b.price)
          break
        case "billing_cycle":
          comparison = a.billing_cycle.localeCompare(b.billing_cycle)
          break
        case "priority":
          // Sort by priority (high > medium > low)
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          comparison =
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) -
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 0)
          break
        default:
          comparison = 0
      }

      // Apply sort direction
      return sortDirection === "asc" ? comparison : -comparison
    })

  // Toggle sort direction or change sort column
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Toggle priority filter
  const togglePriorityFilter = (priority: string) => {
    if (priorityFilter.includes(priority)) {
      setPriorityFilter(priorityFilter.filter((p) => p !== priority))
    } else {
      setPriorityFilter([...priorityFilter, priority])
    }
  }

  // Handle subscription actions
  const handleViewSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setModalMode("view")
    setIsModalOpen(true)
  }

  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleDeleteSubscription = async (subscription: Subscription) => {
    if (confirm(`Are you sure you want to delete "${subscription.name}"? This action cannot be undone.`)) {
      setIsDeleting(true)
      setDeleteError(null)

      try {
        const result = await deleteSubscriptionAction(subscription.id)

        if (result.error) {
          setDeleteError(result.error)
        } else {
          // Refresh the subscriptions list
          fetchData()
        }
      } catch (error: any) {
        setDeleteError(error.message || "Failed to delete subscription")
      } finally {
        setIsDeleting(false)
      }
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading subscriptions...</div>
  }

  if (error || !household) {
    return <div className="text-red-500 p-8">Error: {error || "Household not found"}</div>
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, href: `/households/${householdId}` },
          { label: "Subscriptions", isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">Manage subscriptions for {household.name}</p>
        </div>
        <Link href={`/households/${householdId}/subscriptions/create`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Subscription
          </Button>
        </Link>
      </div>

      {/* Subscription Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Monthly Cost</CardTitle>
            <CardDescription>Total monthly subscription expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(monthlyTotal, "USD")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Yearly Cost</CardTitle>
            <CardDescription>Total yearly subscription expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(yearlyTotal, "USD")}</div>
          </CardContent>
        </Card>
      </div>

      {deleteError && <Alert type="error" message={deleteError} />}

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Bookmark className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No subscriptions yet</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">Add your first subscription to get started</p>
            <Link href={`/households/${householdId}/subscriptions/create`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Subscription
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscriptions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex gap-1">
                    <Filter className="h-4 w-4" />
                    Priority
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={priorityFilter.includes("high")}
                    onCheckedChange={() => togglePriorityFilter("high")}
                  >
                    High
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={priorityFilter.includes("medium")}
                    onCheckedChange={() => togglePriorityFilter("medium")}
                  >
                    Medium
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={priorityFilter.includes("low")}
                    onCheckedChange={() => togglePriorityFilter("low")}
                  >
                    Low
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Select value={billingCycleFilter} onValueChange={setBillingCycleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Billing Cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_cycles">All Cycles</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center">
                      Name
                      {sortColumn === "name" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("price")}>
                    <div className="flex items-center">
                      Price
                      {sortColumn === "price" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("billing_cycle")}>
                    <div className="flex items-center">
                      Billing Cycle
                      {sortColumn === "billing_cycle" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("priority")}>
                    <div className="flex items-center">
                      Priority
                      {sortColumn === "priority" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No subscriptions found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">{subscription.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {subscription.description || "No description"}
                      </TableCell>
                      <TableCell>{formatCurrency(subscription.price, subscription.currency)}</TableCell>
                      <TableCell className="flex items-center">
                        <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                        {getBillingCycleText(subscription.billing_cycle)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadgeClass(subscription.priority)} variant="outline">
                          {subscription.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewSubscription(subscription)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditSubscription(subscription)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteSubscription(subscription)}
                              disabled={isDeleting}
                              className="text-red-500 focus:text-red-500"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subscription={selectedSubscription}
        mode={modalMode}
        onSubscriptionUpdated={fetchData}
      />
    </div>
  )
}

