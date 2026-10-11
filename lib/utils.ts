import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const USD_TO_INR_RATE = 83
export function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
}
export function usdToInr(amountUSD: number) {
  return amountUSD * USD_TO_INR_RATE
}
export function formatINRFromUSD(amountUSD: number) {
  return formatINR(usdToInr(amountUSD))
}
