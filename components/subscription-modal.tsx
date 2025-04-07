"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CurrencySelector } from "@/components/currency-selector"
import { Alert } from "@/components/ui-components"
import { updateSubscriptionAction, deleteSubscriptionAction } from "@/app/(auth)/households/[id]/subscriptions/actions"
import { useRouter } from "next/navigation"
import type { CurrencyCode } from "@/lib/utils"

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

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  subscription: Subscription | null
  mode: "view" | "edit"
  onSubscriptionUpdated: () => void
}

export function SubscriptionModal({
  isOpen,
  onClose,
  subscription,
  mode,
  onSubscriptionUpdated,
}: SubscriptionModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    description: string
    price: number
    currency: CurrencyCode
    billingCycle: string
    priority: string
  }>({
    name: "",
    description: "",
    price: 0,
    currency: "USD",
    billingCycle: "monthly",
    priority: "medium",
  })
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (subscription) {
      setFormData({
        name: subscription.name,
        description: subscription.description || "",
        price: Number(subscription.price),
        currency: subscription.currency as CurrencyCode,
        billingCycle: subscription.billing_cycle,
        priority: subscription.priority,
      })
    }
  }, [subscription])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subscription) return

    setIsLoading(true)
    setError(null)

    try {
      const formDataObj = new FormData()
      formDataObj.append("subscriptionId", subscription.id.toString())
      formDataObj.append("name", formData.name)
      formDataObj.append("description", formData.description)
      formDataObj.append("price", formData.price.toString())
      formDataObj.append("currency", formData.currency)
      formDataObj.append("billingCycle", formData.billingCycle)
      formDataObj.append("priority", formData.priority)

      const result = await updateSubscriptionAction(formDataObj)

      if (result.error) {
        setError(result.error)
      } else {
        onSubscriptionUpdated()
        onClose()
      }
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!subscription) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await deleteSubscriptionAction(subscription.id)

      if (result.error) {
        setError(result.error)
      } else {
        onSubscriptionUpdated()
        onClose()
      }
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  // Helper function to get priority badge class
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!subscription) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{mode === "view" ? subscription.name : "Edit Subscription"}</DialogTitle>
          </DialogHeader>

          {mode === "view" ? (
            <div className="space-y-4">
              {subscription.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <p className="mt-1">{subscription.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                  <p className="mt-1 text-lg font-semibold">
                    {subscription.price} {subscription.currency}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Billing Cycle</h3>
                  <p className="mt-1 capitalize">{subscription.billing_cycle}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Priority</h3>
                <div className="mt-1">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadgeClass(subscription.priority)}`}
                  >
                    {subscription.priority.charAt(0).toUpperCase() + subscription.priority.slice(1)}
                  </span>
                </div>
              </div>

              <DialogFooter className="flex justify-between sm:justify-between">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                  <Button
                    onClick={() =>
                      router.push(`/households/${subscription.household_id}/subscriptions/${subscription.id}/edit`)
                    }
                  >
                    Edit
                  </Button>
                </div>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert type="error" message={error} />}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Subscription Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Netflix"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Family streaming plan"
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium">
                    Price
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="9.99"
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="currency" className="text-sm font-medium">
                    Currency
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <CurrencySelector
                    value={formData.currency}
                    onChange={(value) => handleSelectChange("currency", value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="billingCycle" className="text-sm font-medium">
                    Billing Cycle
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Select
                    value={formData.billingCycle}
                    onValueChange={(value) => handleSelectChange("billingCycle", value)}
                  >
                    <SelectTrigger id="billingCycle">
                      <SelectValue placeholder="Select billing cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="priority" className="text-sm font-medium">
                    Priority
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Select value={formData.priority} onValueChange={(value) => handleSelectChange("priority", value)}>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Subscription</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete "{subscription.name}"? This action cannot be undone.</p>
            {error && <Alert type="error" message={error} className="mt-4" />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {isLoading ? "Deleting..." : "Delete Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

