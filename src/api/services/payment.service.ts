import axiosInstance from "../axios"

export type LoanPayoutPreview = {
  loan_uuid: string
  borrower_name: string
  phone_number: string
  amount: string
  fee: string
  total_debit: string
  currency: string
  group_wallet_balance: string
  finance_wallet_balance: string
  gateway_balance: string
  receiver: Record<string, unknown>
  demo_payout_enabled: boolean
  gateway_available: boolean
}

export const paymentServices = {
  initiateCollection: async (payload: {
    phone: string
    amount: string | number
    purpose: string
    target_uuid: string
  }) => {
    return await axiosInstance.post("/payments/initiate/", payload)
  },
  getTransactionStatus: async (transactionUuid: string) => {
    return await axiosInstance.get(`/payments/status/${transactionUuid}/`)
  },
  previewLoanPayout: async (loanUuid: string) => {
    return await axiosInstance.get<LoanPayoutPreview>(
      `/payments/payouts/loans/${loanUuid}/preview/`
    )
  },
  initiateLoanPayout: async (loanUuid: string) => {
    return await axiosInstance.post<{
      transaction_uuid: string
      status: string
      message: string
    }>(`/payments/payouts/loans/${loanUuid}/initiate/`, {
      confirmed: true,
    })
  },
  simulateLoanPayout: async (loanUuid: string) => {
    return await axiosInstance.post<{
      loan_uuid: string
      status: string
      installment_count: number
      message: string
    }>(`/payments/payouts/loans/${loanUuid}/simulate/`, {
      confirmed: true,
    })
  },
}
