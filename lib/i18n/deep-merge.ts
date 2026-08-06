/**
 * Deep-merge `overrides` onto `base`. Override leaf values win; nested objects merge recursively.
 */
export function deepMerge<T extends Record<string, unknown>>(
  base: T,
  overrides: Record<string, unknown>
): T {
  const result = { ...base } as Record<string, unknown>

  for (const key of Object.keys(overrides)) {
    const override = overrides[key]
    const baseValue = base[key]

    if (
      override !== null &&
      typeof override === "object" &&
      !Array.isArray(override) &&
      baseValue !== null &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      result[key] = deepMerge(
        baseValue as Record<string, unknown>,
        override as Record<string, unknown>
      )
    } else if (override !== undefined) {
      result[key] = override
    }
  }

  return result as T
}
