export interface ApiError {
  response?: {
    data?: {
      mensaje?: string
    }
  }
  message?: string
}
