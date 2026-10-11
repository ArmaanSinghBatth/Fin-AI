export interface Transaction {
  date: string
  description: string
  amount: number // Positive for expenses, negative for income
  category: string
}
