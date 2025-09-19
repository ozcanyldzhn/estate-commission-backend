import { PropertyType } from '../domain/transaction.js';
/**
 * Commission rules (pure domain logic, easily unit-testable)
 * - Base rate by property type
 * - Price breakpoints (progressive)
 */
export function calculateCommissionRate(propertyType: PropertyType, grossPriceMinor: number): number /* in basis points */ {
  const base = propertyType === PropertyType.COMMERCIAL ? 300 : propertyType === PropertyType.LAND ? 150 : 250; // 3.00%, 1.50%, 2.50%
  // Bonus: if gross >= 5,000,000 TRY apply -0.25% discount; >= 15,000,000 TRY apply -0.5%
  const priceTRY = grossPriceMinor / 100; // convert to major units
  const discount = priceTRY >= 15000000 ? 50 : priceTRY >= 5000000 ? 25 : 0; // in bps
  return Math.max(base - discount, 50);
}
export function calculateCommissionAmount(grossPriceMinor: number, rateBps: number): number {
  return Math.round((grossPriceMinor * rateBps) / 10000);
}