"use server"

import { addMemberDirectly as authAddMemberDirectly, deleteMember as authDeleteMember } from "./(auth)/actions"

export async function addMemberDirectly(formData: FormData) {
  return await authAddMemberDirectly(formData)
}

export async function deleteMember(householdId: number, memberId: number) {
  return await authDeleteMember(householdId, memberId)
}

