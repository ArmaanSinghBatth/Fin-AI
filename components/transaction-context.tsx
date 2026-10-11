"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Transaction } from "@/lib/types"

interface TransactionContextValue {
  transactions: Transaction[]
  setTransactions: (transactions: Transaction[]) => void
  totalIncome: number
  totalExpense: number
}

const TransactionContext = createContext<TransactionContextValue | undefined>(undefined)

const STORAGE_KEY = "fin-ai-transactions"

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactionsState] = useState<Transaction[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setTransactionsState(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  const setTransactions = (next: Transaction[]) => {
    setTransactionsState(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const totalIncome = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const totalExpense = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <TransactionContext.Provider value={{ transactions, setTransactions, totalIncome, totalExpense }}>
      {children}
    </TransactionContext.Provider>
  )
}

export function useTransactions() {
  const ctx = useContext(TransactionContext)
  if (!ctx) {
    throw new Error("useTransactions must be used within a TransactionProvider")
  }
  return ctx
}
