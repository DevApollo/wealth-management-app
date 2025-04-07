"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { deleteBankAccountAction } from "@/app/(auth)/households/[id]/bank-accounts/actions"

interface DeleteBankAccountButtonProps {
  bankAccountId: number
  bankAccountName: string
  householdId: number
}

export function DeleteBankAccountButton({ bankAccountId, bankAccountName, householdId }: DeleteBankAccountButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)

    try {
      const result = await deleteBankAccountAction(bankAccountId)

      if (result.error) {
        setError(result.error)
      } else {
        router.push(`/households/${householdId}/bank-accounts`)
      }
    } catch (error: any) {
      setError(error.message || "Failed to delete bank account")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Bank Account</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{bankAccountName}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
          >
            {isDeleting ? "Deleting..." : "Delete Bank Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

