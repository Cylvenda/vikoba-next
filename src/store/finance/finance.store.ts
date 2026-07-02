import { create } from "zustand"
import axiosInstance from "@/api/axios"
import { VikobaFinanceSnapshot } from "@/lib/vikoba-finance"
import type { WalletReport } from "@/api/services/finance.service"

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response
    return response?.data?.detail || fallback
  }

  return fallback
}

interface FinanceState {
  snapshot: VikobaFinanceSnapshot | null
  walletReport: WalletReport | null
  isLoading: boolean
  error: string | null
  fetchSnapshot: (groupId: string) => Promise<void>
  fetchWalletReport: (groupId: string) => Promise<void>
}

export const useFinanceStore = create<FinanceState>((set) => ({
  snapshot: null,
  walletReport: null,
  isLoading: false,
  error: null,

  fetchSnapshot: async (groupId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosInstance.get(`/finance/groups/${groupId}/snapshot/`)
      set({ snapshot: response.data, isLoading: false })
    } catch (error: unknown) {
      set({
        error: getErrorMessage(error, "Failed to fetch finance snapshot"),
        isLoading: false,
      })
    }
  },

  fetchWalletReport: async (groupId: string) => {
    try {
      const response = await axiosInstance.get(`/finance/groups/${groupId}/wallet-report/`)
      set({ walletReport: response.data })
    } catch (error: unknown) {
      set({
        error: getErrorMessage(error, "Failed to fetch wallet report"),
      })
    }
  },
}))
