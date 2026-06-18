import { create } from "zustand"
import axiosInstance from "@/api/axios"
import { VikobaFinanceSnapshot } from "@/lib/vikoba-finance"

interface FinanceState {
  snapshot: VikobaFinanceSnapshot | null
  isLoading: boolean
  error: string | null
  fetchSnapshot: (groupId: string) => Promise<void>
}

export const useFinanceStore = create<FinanceState>((set) => ({
  snapshot: null,
  isLoading: false,
  error: null,

  fetchSnapshot: async (groupId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosInstance.get(`/finance/groups/${groupId}/snapshot/`)
      set({ snapshot: response.data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to fetch finance snapshot",
        isLoading: false,
      })
    }
  },
}))
