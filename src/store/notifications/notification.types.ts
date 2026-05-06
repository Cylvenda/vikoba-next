
export type Notification<T = unknown> = {
     id: string
     type: NotificationType
     message: string
     created_at: Date
     read: boolean
     payload?: T
}


export type NotificationType =
     | "HOLD_SEAT"
     | "BOOKING_CONFIRMED"
     | "PAYMENT_SUCCESS"
     | "PAYMENT_FAILED"
     | "SYSTEM"
