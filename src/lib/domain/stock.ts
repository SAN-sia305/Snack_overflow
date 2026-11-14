import { SnackStatus } from "@/types";

/**
 * Derived stock status calculation helper:
 * - gone: quantity === 0
 * - running_low: quantity > 0 && quantity <= lowStockThreshold
 * - stocked: quantity > lowStockThreshold
 */
export function getStockStatus(
  quantity: number,
  lowStockThreshold: number
): SnackStatus {
  if (quantity <= 0) return "gone";
  if (quantity <= lowStockThreshold) return "running_low";
  return "stocked";
}

