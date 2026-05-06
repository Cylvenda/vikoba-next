export type ApiResponse<T> = {
     data: T
     status: number
}

export type ListResponse<T> = {
     count: string
     next: string | null
     previous: string | null
     results: T[]
}