/** Shared unit options for orders, RFQs, and product quantity fields. */
export const PRODUCT_UNIT_OPTIONS = [
  "pieces",
  "sets",
  "units",
  "kg",
  "meters",
  "cartons",
  "pallets",
  "20ft container",
  "40ft container",
  "boxes",
  "pairs",
  "tons",
  "rolls",
  "pcs",
] as const

export type ProductUnit = (typeof PRODUCT_UNIT_OPTIONS)[number]

export const DEFAULT_PRODUCT_UNIT: ProductUnit = "pieces"
