import api from "../axios"
import { API_ENDPOINTS } from "../endpoints"
import type { ApiResponse } from "../types"

export type LoanProduct = {
  uuid: string
  group: string
  name: string
  amount: string
  interest_rate: string
  use_group_default_late_fee: boolean
  late_fee_amount: string
  duration_type: "MONTHS" | "WEEKS" | "DAYS"
  duration_count: number
  description: string | null
  created_by: string | null
  created_at: string
}

export type LoanProductPayload = {
  group_uuid: string
  name: string
  amount: string
  interest_rate: string
  use_group_default_late_fee?: boolean
  late_fee_amount?: string
  duration_type: LoanProduct["duration_type"]
  duration_count: number
  description?: string
}

type LoanApiResponse = {
  uuid: string
  group: string
  group_name: string
  loan_request_category: string
  loan_request_category_name: string
  requested_amount: string
  principal_amount: string
  interest_amount: string
  total_repayment_amount: string
  total_paid: string
  balance: string
  loan_product_use_group_default_late_fee: boolean
  loan_product_late_fee_amount: string
  group_default_late_fee_amount: string
  effective_late_fee_amount: string
  overdue_installments_count: number
  accrued_late_fee_amount: string
  amount_paid: string
  remaining_balance: string
  duration_type: LoanProduct["duration_type"]
  duration_count: number
  borrower: string
  borrower_name: string
  interest_rate: string
  purpose: string | null
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "PAID_OFF" | "OVERDUE" | "COMPLETED" | "DEFAULTED"
  approved_by: string | null
  approved_at: string | null
  disbursed_at: string | null
  due_date: string
  created_at: string
}

export type Loan = {
  uuid: string
  group: string
  group_name: string
  loan_product: string
  loan_product_name: string
  principal_amount: string
  interest_amount: string
  total_repayment_amount: string
  total_paid: string
  balance: string
  loan_product_use_group_default_late_fee: boolean
  loan_product_late_fee_amount: string
  group_default_late_fee_amount: string
  effective_late_fee_amount: string
  overdue_installments_count: number
  accrued_late_fee_amount: string
  amount_paid: string
  remaining_balance: string
  duration_type: LoanProduct["duration_type"]
  duration_count: number
  borrower: string
  borrower_name: string
  interest_rate: string
  purpose: string | null
  status: LoanApiResponse["status"]
  approved_by: string | null
  approved_at: string | null
  disbursed_at: string | null
  due_date: string
  created_at: string
}

export type LoanInstallment = {
  uuid: string
  loan: string
  installment_number: number
  due_date: string
  amount_due: string
  amount_paid: string
  late_fee_amount: string
  late_fee_paid: string
  late_fee_balance: string
  remaining_balance: string
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE"
  created_at: string
}

export type LoanPayment = {
  uuid: string
  loan: string
  installment: string | null
  installment_number: number | null
  amount: string
  payment_date: string
  paid_at: string
  payment_method: "CASH" | "MOBILE_MONEY" | "BANK" | "CREDIT_CARD"
  reference: string | null
  reference_number: string | null
  received_by: string | null
  note: string | null
  created_at: string
}

export type CreateLoanPayload = {
  group_id: string
  loan_product_id: string
  interest_rate: string
  purpose?: string
}

export type Fine = {
  uuid: string
  group: string
  member: string
  member_name: string
  reason: string
  amount: string
  status: "UNPAID" | "PAID"
  issued_at: string
  due_date: string
  total_paid: string
  balance: string
}

export type FinePayment = {
  uuid: string
  fine: string
  fine_reason: string
  amount: string
  paid_at: string
  received_by: string | null
  received_by_name: string
  reference: string | null
  note: string | null
  created_at: string
}

export type CreateFinePaymentPayload = {
  group_id: string
  fine_id: string
  amount: string
  reference?: string
  note?: string
}

export type Contribution = {
  uuid: string
  group: string
  group_name: string
  member: string
  member_name: string
  amount: string
  status: "PENDING" | "VERIFIED" | "REJECTED"
  reference: string | null
  paid_at: string
  received_by: string | null
  received_by_name: string
  note: string | null
  created_at: string
}

export type CreateContributionPayload = {
  group_id: string
  membership_id: string
  amount: string
  reference?: string
  note?: string
  status?: "PENDING" | "VERIFIED"
}

const mapLoan = (loan: LoanApiResponse): Loan => ({
  uuid: loan.uuid,
  group: loan.group,
  group_name: loan.group_name,
  loan_product: loan.loan_request_category,
  loan_product_name: loan.loan_request_category_name,
  principal_amount: loan.principal_amount,
  interest_amount: loan.interest_amount,
  total_repayment_amount: loan.total_repayment_amount,
  total_paid: loan.total_paid,
  balance: loan.balance,
  loan_product_use_group_default_late_fee: loan.loan_product_use_group_default_late_fee,
  loan_product_late_fee_amount: loan.loan_product_late_fee_amount,
  group_default_late_fee_amount: loan.group_default_late_fee_amount,
  effective_late_fee_amount: loan.effective_late_fee_amount,
  overdue_installments_count: loan.overdue_installments_count,
  accrued_late_fee_amount: loan.accrued_late_fee_amount,
  amount_paid: loan.amount_paid,
  remaining_balance: loan.remaining_balance,
  duration_type: loan.duration_type,
  duration_count: loan.duration_count,
  borrower: loan.borrower,
  borrower_name: loan.borrower_name,
  interest_rate: loan.interest_rate,
  purpose: loan.purpose,
  status: loan.status,
  approved_by: loan.approved_by,
  approved_at: loan.approved_at,
  disbursed_at: loan.disbursed_at,
  due_date: loan.due_date,
  created_at: loan.created_at,
})

const mapLoanList = (loans: LoanApiResponse[]) => loans.map(mapLoan)

const mapFine = (fine: Fine): Fine => fine

const mapFineList = (fines: Fine[]) => fines.map(mapFine)

export const financeServices = {
  async getContributions(groupUuid: string): Promise<ApiResponse<Contribution[]>> {
    const response = await api.get<Contribution[]>(API_ENDPOINTS.FINANCE_CONTRIBUTIONS, {
      params: {
        group_uuid: groupUuid,
      },
    })

    return {
      status: response.status,
      data: response.data,
    }
  },

  async createContribution(payload: CreateContributionPayload): Promise<ApiResponse<Contribution>> {
    const response = await api.post<Contribution>(API_ENDPOINTS.FINANCE_CONTRIBUTIONS, payload)

    return {
      status: response.status,
      data: response.data,
    }
  },

  async getLoanProducts(groupUuid: string): Promise<ApiResponse<LoanProduct[]>> {
    const response = await api.get<LoanProduct[]>(API_ENDPOINTS.FINANCE_LOAN_PRODUCTS, {
      params: {
        group_uuid: groupUuid,
      },
    })

    return {
      status: response.status,
      data: response.data,
    }
  },

  async createLoanProduct(payload: LoanProductPayload): Promise<ApiResponse<LoanProduct>> {
    const response = await api.post<LoanProduct>(API_ENDPOINTS.FINANCE_LOAN_PRODUCTS, payload)

    return {
      status: response.status,
      data: response.data,
    }
  },

  async updateLoanProduct(
    productUuid: string,
    payload: Omit<LoanProductPayload, "group_uuid">
  ): Promise<ApiResponse<LoanProduct>> {
    const response = await api.patch<LoanProduct>(
      `${API_ENDPOINTS.FINANCE_LOAN_PRODUCTS}${productUuid}/`,
      payload
    )

    return {
      status: response.status,
      data: response.data,
    }
  },

  async deleteLoanProduct(productUuid: string): Promise<ApiResponse<void>> {
    const response = await api.delete<void>(`${API_ENDPOINTS.FINANCE_LOAN_PRODUCTS}${productUuid}/`)

    return {
      status: response.status,
      data: response.data,
    }
  },

  async getLoans(groupUuid: string): Promise<ApiResponse<Loan[]>> {
    const response = await api.get<LoanApiResponse[]>(API_ENDPOINTS.FINANCE_LOANS, {
      params: {
        group_uuid: groupUuid,
      },
    })

    return {
      status: response.status,
      data: mapLoanList(response.data),
    }
  },

  async createLoan(payload: CreateLoanPayload): Promise<ApiResponse<Loan>> {
    const response = await api.post<LoanApiResponse>(API_ENDPOINTS.FINANCE_LOANS, {
      group_id: payload.group_id,
      loan_request_category_id: payload.loan_product_id,
      interest_rate: payload.interest_rate,
      purpose: payload.purpose,
    })

    return {
      status: response.status,
      data: mapLoan(response.data),
    }
  },

  async approveLoan(loanUuid: string): Promise<ApiResponse<Loan>> {
    const response = await api.post<LoanApiResponse>(`${API_ENDPOINTS.FINANCE_LOANS}${loanUuid}/approve/`)

    return {
      status: response.status,
      data: mapLoan(response.data),
    }
  },

  async disburseLoan(loanUuid: string): Promise<ApiResponse<Loan>> {
    const response = await api.post<LoanApiResponse>(`${API_ENDPOINTS.FINANCE_LOANS}${loanUuid}/disburse/`)

    return {
      status: response.status,
      data: mapLoan(response.data),
    }
  },

  async rejectLoan(loanUuid: string): Promise<ApiResponse<Loan>> {
    const response = await api.post<LoanApiResponse>(`${API_ENDPOINTS.FINANCE_LOANS}${loanUuid}/reject/`)

    return {
      status: response.status,
      data: mapLoan(response.data),
    }
  },

  async getFines(groupUuid: string): Promise<ApiResponse<Fine[]>> {
    const response = await api.get<Fine[]>(API_ENDPOINTS.FINANCE_FINES, {
      params: {
        group_uuid: groupUuid,
      },
    })

    return {
      status: response.status,
      data: mapFineList(response.data),
    }
  },

  async getFinePayments(groupUuid: string): Promise<ApiResponse<FinePayment[]>> {
    const response = await api.get<FinePayment[]>(API_ENDPOINTS.FINANCE_FINE_PAYMENTS, {
      params: {
        group_uuid: groupUuid,
      },
    })

    return {
      status: response.status,
      data: response.data,
    }
  },

  async createFinePayment(payload: CreateFinePaymentPayload): Promise<ApiResponse<FinePayment>> {
    const response = await api.post<FinePayment>(API_ENDPOINTS.FINANCE_FINE_PAYMENTS, payload)

    return {
      status: response.status,
      data: response.data,
    }
  },

  async getLoanCategories(groupUuid: string): Promise<ApiResponse<LoanProduct[]>> {
    return this.getLoanProducts(groupUuid)
  },

  async createLoanCategory(payload: LoanProductPayload): Promise<ApiResponse<LoanProduct>> {
    return this.createLoanProduct(payload)
  },

  async updateLoanCategory(
    productUuid: string,
    payload: Omit<LoanProductPayload, "group_uuid">
  ): Promise<ApiResponse<LoanProduct>> {
    return this.updateLoanProduct(productUuid, payload)
  },

  async deleteLoanCategory(productUuid: string): Promise<ApiResponse<void>> {
    return this.deleteLoanProduct(productUuid)
  },

  async getLoanRequests(groupUuid: string): Promise<ApiResponse<Loan[]>> {
    return this.getLoans(groupUuid)
  },

  async createLoanRequest(payload: CreateLoanPayload): Promise<ApiResponse<Loan>> {
    return this.createLoan(payload)
  },

  async approveLoanRequest(loanUuid: string): Promise<ApiResponse<Loan>> {
    return this.approveLoan(loanUuid)
  },

  async rejectLoanRequest(loanUuid: string): Promise<ApiResponse<Loan>> {
    return this.rejectLoan(loanUuid)
  },

  async repayLoan(loanUuid: string, payload: { amount: string; payment_method: string; reference?: string; note?: string }): Promise<ApiResponse<unknown>> {
    const response = await api.post(`finance/loans/${loanUuid}/repay/`, payload)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async getLoanInstallments(loanUuid: string): Promise<ApiResponse<LoanInstallment[]>> {
    const response = await api.get<LoanInstallment[]>(
      `${API_ENDPOINTS.FINANCE_LOAN_INSTALLMENTS}${loanUuid}/installments/`
    )
    return {
      status: response.status,
      data: response.data,
    }
  },

  async getLoanPayments(loanUuid: string): Promise<ApiResponse<LoanPayment[]>> {
    const response = await api.get<LoanPayment[]>(
      `${API_ENDPOINTS.FINANCE_LOAN_PAYMENTS}${loanUuid}/payments/`
    )
    return {
      status: response.status,
      data: response.data,
    }
  },
}
