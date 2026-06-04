import { useState } from 'react'
import type { ApiError } from '@/types/api'

export function useErrorHandler() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const clear = () => { setError(''); setSuccess('') }

  const handleError = (err: ApiError) => {
    setError(err.response?.data?.mensaje || err.message || 'Error inesperado')
  }

  const handleSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  return { error, setError, success, setSuccess, loading, setLoading, clear, handleError, handleSuccess }
}
