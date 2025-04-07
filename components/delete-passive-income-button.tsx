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
import { deletePassiveIncomeAction } from "@/app/(auth)/households/[id]/passive-income/actions"

interface DeletePassiveIncomeButtonProps {
  passiveIncomeId: number
  passiveIncomeName: string
  householdId: number
}

export function DeletePassiveIncomeButton({
  passiveIncomeId,
  passiveIncomeName,
  householdId,
}: DeletePassiveIncomeButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)

    try {
      const result = await deletePassiveIncomeAction(passiveIncomeId)

      if (result.error) {
        setError(result.error)
      } else {
        router.push(`/households/${householdId}/passive-income`)
      }
    } catch (error: any) {
      setError(error.message || "Failed to delete passive income")
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
          <AlertDialogTitle>Delete Passive Income</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{passiveIncomeName}"? This action cannot be undone.
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
            {isDeleting ? "Deleting..." : "Delete Passive Income"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

