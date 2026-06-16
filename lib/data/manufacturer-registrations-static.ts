import type { ManufacturerApplication } from "@/lib/api/admin-manufacturer-registrations"
import raw from "./manufacturer-registrations.json"

/** Same envelope shape as a typical JSON API response. */
export type ManufacturerRegistrationsResponse = {
  success?: boolean
  message?: string
  data: ManufacturerApplication[]
}

const envelope = raw as unknown as ManufacturerRegistrationsResponse

/** Deep copy of seed rows for UI state (approve/reject updates stay in memory only). */
export function cloneManufacturerRegistrationsSeed(): ManufacturerApplication[] {
  return envelope.data.map((row) => ({ ...row }))
}

export const manufacturerRegistrationsApiExample: ManufacturerRegistrationsResponse = envelope
