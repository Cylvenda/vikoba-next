import axiosInstance from "../axios"

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
}
