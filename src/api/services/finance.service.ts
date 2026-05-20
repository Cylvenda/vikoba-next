import api from "../axios"
import { API_ENDPOINTS } from "../endpoints"
import type { ApiResponse } from "../types"

export type LoanCategory = {
  uuid: string
  group: string
  name: string
  amount: string
  duration_type: "MONTHS" | "WEEKS" | "DAYS"
  duration_count: number
  description: string | null
  created_by: string | null
  created_at: string
}

export type LoanCategoryPayload = {
  group_uuid: string
  name: string
  amount: string
  duration_type: LoanCategory["duration_type"]
  duration_count: number
  description?: string
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
  paid_at: string
  reference?: string
  note?: string
}

export type LoanRequest = {
  uuid: string
  group: string
  group_name: string
  loan_request_category: string
  loan_request_category_name: string
  requested_amount: string
  duration_type: LoanCategory["duration_type"]
  duration_count: number
  borrower: string
  borrower_name: string
  interest_rate: string
  purpose: string | null
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "COMPLETED" | "DEFAULTED"
  approved_by: string | null
  approved_at: string | null
  disbursed_at: string | null
  due_date: string
  created_at: string
}

export type CreateLoanRequestPayload = {
  group_id: string
  loan_request_category_id: string
  interest_rate: string
  purpose?: string
}

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

  async getLoanCategories(groupUuid: string): Promise<ApiResponse<LoanCategory[]>> {
    const response = await api.get<LoanCategory[]>(API_ENDPOINTS.FINANCE_LOAN_CATEGORIES, {
      params: {
        group_uuid: groupUuid,
      },
    })

    return {
      status: response.status,
      data: response.data,
    }
  },

  async createLoanCategory(payload: LoanCategoryPayload): Promise<ApiResponse<LoanCategory>> {
    const response = await api.post<LoanCategory>(API_ENDPOINTS.FINANCE_LOAN_CATEGORIES, payload)

    return {
      status: response.status,
      data: response.data,
    }
  },

  async updateLoanCategory(
    categoryUuid: string,
    payload: Omit<LoanCategoryPayload, "group_uuid">
  ): Promise<ApiResponse<LoanCategory>> {
    const response = await api.patch<LoanCategory>(
      `${API_ENDPOINTS.FINANCE_LOAN_CATEGORIES}${categoryUuid}/`,
      payload
    )

    return {
      status: response.status,
      data: response.data,
    }
  },

  async deleteLoanCategory(categoryUuid: string): Promise<ApiResponse<void>> {
    const response = await api.delete<void>(`${API_ENDPOINTS.FINANCE_LOAN_CATEGORIES}${categoryUuid}/`)

    return {
      status: response.status,
      data: response.data,
    }
  },

  async getLoanRequests(groupUuid: string): Promise<ApiResponse<LoanRequest[]>> {
    const response = await api.get<LoanRequest[]>(API_ENDPOINTS.FINANCE_LOAN_REQUESTS, {
      params: {
        group_uuid: groupUuid,
      },
    })

    return {
      status: response.status,
      data: response.data,
    }
  },

  async createLoanRequest(payload: CreateLoanRequestPayload): Promise<ApiResponse<LoanRequest>> {
    const response = await api.post<LoanRequest>(API_ENDPOINTS.FINANCE_LOAN_REQUESTS, payload)

    return {
      status: response.status,
      data: response.data,
    }
  },

  async approveLoanRequest(loanUuid: string): Promise<ApiResponse<LoanRequest>> {
    const response = await api.post<LoanRequest>(
      `${API_ENDPOINTS.FINANCE_LOAN_REQUESTS}${loanUuid}/approve/`
    )

    return {
      status: response.status,
      data: response.data,
    }
  },

  async rejectLoanRequest(loanUuid: string): Promise<ApiResponse<LoanRequest>> {
    const response = await api.post<LoanRequest>(
      `${API_ENDPOINTS.FINANCE_LOAN_REQUESTS}${loanUuid}/reject/`
    )

    return {
      status: response.status,
      data: response.data,
    }
  },
}
