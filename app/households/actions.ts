"use server"

import { createHousehold as authCreateHousehold } from "../(auth)/households/actions"
import { addMemberDirectly as authAddMemberDirectly } from "../(auth)/actions"

export async function createHousehold(formData: FormData) {
  return await authCreateHousehold(formData)
}

export async function addMemberDirectly(formData: FormData) {
  return await authAddMemberDirectly(formData)
}

