export interface ApiError {
  response?: {
    data?: {
      mensaje?: string
      error?: string
    }
  }
  message?: string
}
